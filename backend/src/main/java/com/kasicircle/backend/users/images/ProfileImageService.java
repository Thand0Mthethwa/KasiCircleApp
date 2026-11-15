package com.kasicircle.backend.users.images;

import com.kasicircle.backend.businesses.storage.ImageStorageService;
import com.kasicircle.backend.businesses.storage.ImageUploadResult;
import com.kasicircle.backend.users.dto.UserProfileResponse;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import com.kasicircle.backend.users.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class ProfileImageService {
    public static final String FOLDER = "kasicircle/account-avatars";
    private static final Logger log = LoggerFactory.getLogger(ProfileImageService.class);
    private final UserRepository users;
    private final UserService profiles;
    private final ImageStorageService storage;
    private final ProfileImageValidator validator;
    private final ProfileImageCleanupRepository cleanup;
    private final TransactionTemplate transactions;

    public ProfileImageService(UserRepository users, UserService profiles, ImageStorageService storage,
            ProfileImageValidator validator, ProfileImageCleanupRepository cleanup, TransactionTemplate transactions) {
        this.users = users; this.profiles = profiles; this.storage = storage; this.validator = validator;
        this.cleanup = cleanup; this.transactions = transactions;
    }

    public UserProfileResponse upload(MultipartFile file) {
        UUID userId = currentUserId();
        validator.validate(file);
        ImageUploadResult uploaded;
        try { uploaded = storage.uploadImage(file, FOLDER); }
        catch (RuntimeException ex) { throw unavailable(); }
        if (uploaded == null || !ownsAsset(uploaded.storageId()) || uploaded.imageUrl() == null
                || !uploaded.imageUrl().startsWith("https://") || uploaded.imageUrl().length() > 500) {
            // Never attempt deletion of an unexpected ID, including a business gallery ID.
            if (uploaded != null && ownsAsset(uploaded.storageId())) cleanupUncommitted(uploaded.storageId());
            throw unavailable();
        }
        try {
            return transactions.execute(status -> {
                User user = users.findForImageUpdate(userId).orElseThrow(ProfileImageService::missingUser);
                String oldId = user.getProfileImagePublicId();
                user.setProfileImageUrl(uploaded.imageUrl());
                user.setProfileImagePublicId(uploaded.storageId());
                users.saveAndFlush(user);
                enqueue(oldId);
                return profiles.getCurrentUser();
            });
        } catch (RuntimeException ex) {
            cleanupUncommitted(uploaded.storageId());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Your picture could not be saved. Please try again.");
        }
    }

    public UserProfileResponse remove() {
        UUID userId = currentUserId();
        return transactions.execute(status -> {
            User user = users.findForImageUpdate(userId).orElseThrow(ProfileImageService::missingUser);
            String oldId = user.getProfileImagePublicId();
            user.setProfileImageUrl(null); user.setProfileImagePublicId(null);
            users.saveAndFlush(user);
            enqueue(oldId);
            return profiles.getCurrentUser();
        });
    }

    private UUID currentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }
        return users.findByEmail(auth.getName()).orElseThrow(ProfileImageService::missingUser).getId();
    }

    private void enqueue(String id) {
        if (id != null && ownsAsset(id)) cleanup.save(new ProfileImageCleanup(id));
    }

    private void cleanupUncommitted(String id) {
        try {
            // A commit acknowledgement can fail after the DB committed. Never delete a current reference.
            if (users.existsByProfileImagePublicId(id)) return;
        } catch (RuntimeException ex) {
            log.warn("Avatar persistence outcome is uncertain; retaining uploaded asset for reconciliation.");
            return;
        }
        try { storage.deleteImage(id); }
        catch (RuntimeException ex) {
            try { transactions.executeWithoutResult(status -> enqueue(id)); }
            catch (RuntimeException queueFailure) { log.warn("Avatar orphan cleanup could not be queued; reconciliation is required."); }
        }
    }

    public static boolean ownsAsset(String id) {
        if (id == null || !id.startsWith(FOLDER + "/")) return false;
        try { return UUID.fromString(id.substring(FOLDER.length() + 1)).toString().equals(id.substring(FOLDER.length() + 1)); }
        catch (IllegalArgumentException ex) { return false; }
    }
    private static ResponseStatusException missingUser() { return new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found."); }
    private static ResponseStatusException unavailable() { return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Profile picture storage is unavailable. Please try again later."); }
}
