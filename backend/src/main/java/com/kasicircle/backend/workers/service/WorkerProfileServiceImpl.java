package com.kasicircle.backend.workers.service;

import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.exception.UserNotFoundException;
import com.kasicircle.backend.users.repository.UserRepository;
import com.kasicircle.backend.workers.domain.WorkerProfile;
import com.kasicircle.backend.workers.dto.WorkerProfileRequest;
import com.kasicircle.backend.workers.dto.WorkerProfileResponse;
import com.kasicircle.backend.workers.exception.WorkerProfileNotFoundException;
import com.kasicircle.backend.workers.repository.WorkerProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

@Service
public class WorkerProfileServiceImpl implements WorkerProfileService {

    private final WorkerProfileRepository workerProfileRepository;
    private final UserRepository userRepository;

    public WorkerProfileServiceImpl(
            WorkerProfileRepository workerProfileRepository,
            UserRepository userRepository
    ) {
        this.workerProfileRepository = workerProfileRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public WorkerProfileResponse createMyProfile(WorkerProfileRequest request) {
        User owner = getCurrentWorker();
        if (workerProfileRepository.existsByOwnerId(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A worker profile already exists for this account.");
        }

        WorkerProfile profile = new WorkerProfile();
        profile.setOwner(owner);
        applyRequest(profile, request);
        return toResponse(workerProfileRepository.save(profile));
    }

    @Override
    @Transactional
    public WorkerProfileResponse updateMyProfile(WorkerProfileRequest request) {
        User owner = getCurrentWorker();
        WorkerProfile profile = workerProfileRepository.findByOwnerId(owner.getId())
                .orElseThrow(() -> new WorkerProfileNotFoundException("Worker profile not found."));
        applyRequest(profile, request);
        return toResponse(workerProfileRepository.save(profile));
    }

    @Override
    @Transactional(readOnly = true)
    public WorkerProfileResponse getMyProfile() {
        User owner = getCurrentWorker();
        WorkerProfile profile = workerProfileRepository.findByOwnerId(owner.getId())
                .orElseThrow(() -> new WorkerProfileNotFoundException("Worker profile not found."));
        return toResponse(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkerProfileResponse getPublicProfile(UUID profileId) {
        WorkerProfile profile = workerProfileRepository.findById(profileId)
                .orElseThrow(() -> new WorkerProfileNotFoundException("Worker profile not found."));
        return toResponse(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkerProfileResponse> searchPublicProfiles(
            String search, String category, String skill, String city, Pageable pageable
    ) {
        return workerProfileRepository.searchPublicProfiles(
                        normalizeFilter(search), normalizeFilter(category),
                        normalizeFilter(skill), normalizeFilter(city), pageable)
                .map(this::toResponse);
    }

    private User getCurrentWorker() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = principal instanceof UserDetails details ? details.getUsername() : principal.toString();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found."));
        if (user.getAccountType() != AccountType.WORKER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only WORKER accounts can manage worker profiles.");
        }
        return user;
    }

    private void applyRequest(WorkerProfile profile, WorkerProfileRequest request) {
        profile.setHeadline(request.headline().trim());
        profile.setBio(request.bio().trim());
        profile.setSkills(normalizeValues(request.skills()));
        profile.setServiceCategories(normalizeValues(request.serviceCategories()));
        profile.setCity(request.city().trim());
        profile.setProvince(request.province().trim());
    }

    private Set<String> normalizeValues(Set<String> values) {
        TreeSet<String> sortedValues = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        values.stream().map(String::trim).filter(value -> !value.isEmpty()).forEach(sortedValues::add);
        return new LinkedHashSet<>(sortedValues);
    }

    private String normalizeFilter(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private WorkerProfileResponse toResponse(WorkerProfile profile) {
        User owner = profile.getOwner();
        String displayName = owner.getFirstName() + " " + owner.getLastName();
        return new WorkerProfileResponse(
                profile.getId(),
                owner.getId(),
                displayName,
                profile.getHeadline(),
                profile.getBio(),
                Set.copyOf(profile.getSkills()),
                Set.copyOf(profile.getServiceCategories()),
                profile.getCity(),
                profile.getProvince(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}
