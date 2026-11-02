package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.domain.BusinessImage;
import com.kasicircle.backend.businesses.dto.BusinessImageResponse;
import com.kasicircle.backend.businesses.exception.BusinessNotFoundException;
import com.kasicircle.backend.businesses.exception.ImageNotFoundException;
import com.kasicircle.backend.businesses.exception.ImageQuotaExceededException;
import com.kasicircle.backend.businesses.mapper.BusinessImageMapper;
import com.kasicircle.backend.businesses.repository.BusinessImageRepository;
import com.kasicircle.backend.businesses.repository.BusinessRepository;
import com.kasicircle.backend.businesses.storage.ImageStorageService;
import com.kasicircle.backend.businesses.storage.ImageUploadResult;
import com.kasicircle.backend.businesses.validation.ImageValidator;
import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.exception.UserNotFoundException;
import com.kasicircle.backend.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class BusinessImageServiceImpl implements BusinessImageService {

    private static final Logger log = LoggerFactory.getLogger(BusinessImageServiceImpl.class);
    private static final int MAX_IMAGES_PER_BUSINESS = 10;

    private final BusinessImageRepository businessImageRepository;
    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;
    private final ImageStorageService imageStorageService;
    private final ImageValidator imageValidator;
    private final BusinessImageMapper businessImageMapper;

    public BusinessImageServiceImpl(
            BusinessImageRepository businessImageRepository,
            BusinessRepository businessRepository,
            UserRepository userRepository,
            ImageStorageService imageStorageService,
            ImageValidator imageValidator,
            BusinessImageMapper businessImageMapper
    ) {
        this.businessImageRepository = businessImageRepository;
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
        this.imageStorageService = imageStorageService;
        this.imageValidator = imageValidator;
        this.businessImageMapper = businessImageMapper;
    }

    @Override
    @Transactional
    public BusinessImageResponse uploadImage(UUID businessId, MultipartFile file, boolean isCover) {
        // 1. Validate image format, size, and content
        ImageValidator.ValidatedImage validated = imageValidator.validate(file);

        // 2. Authorize user and business ownership
        User owner = getAuthenticatedUser();
        verifyBusinessAccount(owner);
        Business business = getBusinessByIdInternal(businessId);
        verifyOwnership(business, owner);

        // 3. Check quota (max 10 images)
        long currentImageCount = businessImageRepository.countByBusinessId(businessId);
        if (currentImageCount >= MAX_IMAGES_PER_BUSINESS) {
            throw new ImageQuotaExceededException("Maximum limit of " + MAX_IMAGES_PER_BUSINESS + " images reached for this business.");
        }

        // 4. Determine cover status (first image is automatically cover)
        boolean shouldBeCover = currentImageCount == 0 || isCover;

        // 5. Upload to Cloudinary
        String folder = "kasicircle/businesses/" + businessId;
        ImageUploadResult uploadResult = imageStorageService.uploadImage(file, folder);

        // 6. Save to Database with compensating cleanup on failure
        try {
            if (shouldBeCover) {
                businessImageRepository.unsetCoverForBusiness(businessId);
            }

            BusinessImage businessImage = BusinessImage.builder()
                    .business(business)
                    .imageUrl(uploadResult.imageUrl())
                    .storageId(uploadResult.storageId())
                    .fileName(validated.sanitizedFileName())
                    .contentType(validated.contentType())
                    .fileSize(validated.fileSize())
                    .isCover(shouldBeCover)
                    .sortOrder(0)
                    .build();

            BusinessImage saved = businessImageRepository.save(businessImage);
            return businessImageMapper.toResponse(saved);
        } catch (Exception ex) {
            log.error("Database save failed for business image. Triggering compensating cleanup in storage for: {}",
                    uploadResult.storageId(), ex);
            try {
                imageStorageService.deleteImage(uploadResult.storageId());
            } catch (Exception cleanupEx) {
                log.error("Compensating cleanup failed for asset {}: {}", uploadResult.storageId(), cleanupEx.getMessage(), cleanupEx);
            }
            throw ex;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<BusinessImageResponse> getImagesForBusiness(UUID businessId) {
        if (!businessRepository.existsById(businessId)) {
            throw new BusinessNotFoundException("Business with ID " + businessId + " not found.");
        }

        return businessImageRepository
                .findByBusinessIdOrderByIsCoverDescSortOrderAscCreatedAtDesc(businessId)
                .stream()
                .map(businessImageMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deleteImage(UUID businessId, UUID imageId) {
        User owner = getAuthenticatedUser();
        verifyBusinessAccount(owner);
        Business business = getBusinessByIdInternal(businessId);
        verifyOwnership(business, owner);

        BusinessImage image = businessImageRepository.findByIdAndBusinessId(imageId, businessId)
                .orElseThrow(() -> new ImageNotFoundException("Image with ID " + imageId + " not found for business " + businessId));

        boolean wasCover = Boolean.TRUE.equals(image.getIsCover());

        // Delete from cloud storage first
        imageStorageService.deleteImage(image.getStorageId());

        // Delete from database
        businessImageRepository.delete(image);

        // If the deleted image was the cover photo, promote another remaining image
        if (wasCover) {
            List<BusinessImage> remaining = businessImageRepository.findByBusinessIdOrderByCreatedAtAsc(businessId);
            if (!remaining.isEmpty()) {
                BusinessImage newCover = remaining.get(0);
                newCover.setIsCover(true);
                businessImageRepository.save(newCover);
                log.info("Promoted image {} as new cover for business {}", newCover.getId(), businessId);
            }
        }
    }

    @Override
    @Transactional
    public BusinessImageResponse setCoverImage(UUID businessId, UUID imageId) {
        User owner = getAuthenticatedUser();
        verifyBusinessAccount(owner);
        Business business = getBusinessByIdInternal(businessId);
        verifyOwnership(business, owner);

        BusinessImage image = businessImageRepository.findByIdAndBusinessId(imageId, businessId)
                .orElseThrow(() -> new ImageNotFoundException("Image with ID " + imageId + " not found for business " + businessId));

        businessImageRepository.unsetCoverForBusiness(businessId);
        image.setIsCover(true);
        BusinessImage saved = businessImageRepository.save(image);

        return businessImageMapper.toResponse(saved);
    }

    private Business getBusinessByIdInternal(UUID id) {
        return businessRepository.findById(id)
                .orElseThrow(() -> new BusinessNotFoundException("Business with ID " + id + " not found."));
    }

    private void verifyBusinessAccount(User user) {
        if (user.getAccountType() != AccountType.BUSINESS) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only BUSINESS accounts can manage business images.");
        }
    }

    private void verifyOwnership(Business business, User owner) {
        if (business.getOwner() == null || business.getOwner().getId() == null || owner.getId() == null ||
                !business.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to modify images for this business.");
        }
    }

    private User getAuthenticatedUser() {
        String email = getAuthenticatedUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found"));
    }

    private String getAuthenticatedUserEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal.toString();
    }
}

