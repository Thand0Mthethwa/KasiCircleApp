package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.domain.BusinessImage;
import com.kasicircle.backend.businesses.dto.BusinessRatingStats;
import com.kasicircle.backend.businesses.dto.CreateBusinessRequest;
import com.kasicircle.backend.businesses.dto.UpdateBusinessRequest;
import com.kasicircle.backend.businesses.dto.BusinessResponse;
import com.kasicircle.backend.businesses.mapper.BusinessMapper;
import com.kasicircle.backend.businesses.repository.BusinessImageRepository;
import com.kasicircle.backend.businesses.repository.BusinessRepository;
import com.kasicircle.backend.businesses.repository.BusinessReviewRepository;
import com.kasicircle.backend.businesses.repository.BusinessSpecifications;
import com.kasicircle.backend.businesses.storage.ImageStorageService;
import com.kasicircle.backend.businesses.exception.BusinessAlreadyExistsException;
import com.kasicircle.backend.businesses.exception.BusinessNotFoundException;
import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.exception.UserNotFoundException;
import com.kasicircle.backend.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public class BusinessServiceImpl implements BusinessService {

    private static final Logger log = LoggerFactory.getLogger(BusinessServiceImpl.class);

    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;
    private final BusinessMapper businessMapper;
    private final BusinessImageRepository businessImageRepository;
    private final ImageStorageService imageStorageService;
    private final BusinessReviewRepository businessReviewRepository;

    @Autowired
    public BusinessServiceImpl(
            BusinessRepository businessRepository,
            UserRepository userRepository,
            BusinessMapper businessMapper,
            @Autowired(required = false) BusinessImageRepository businessImageRepository,
            @Autowired(required = false) ImageStorageService imageStorageService,
            @Autowired(required = false) BusinessReviewRepository businessReviewRepository
    ) {
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
        this.businessMapper = businessMapper;
        this.businessImageRepository = businessImageRepository;
        this.imageStorageService = imageStorageService;
        this.businessReviewRepository = businessReviewRepository;
    }

    public BusinessServiceImpl(
            BusinessRepository businessRepository,
            UserRepository userRepository,
            BusinessMapper businessMapper,
            BusinessImageRepository businessImageRepository,
            ImageStorageService imageStorageService
    ) {
        this(businessRepository, userRepository, businessMapper, businessImageRepository, imageStorageService, null);
    }

    public BusinessServiceImpl(
            BusinessRepository businessRepository,
            UserRepository userRepository,
            BusinessMapper businessMapper
    ) {
        this(businessRepository, userRepository, businessMapper, null, null, null);
    }

    @Override
    @Transactional
    public BusinessResponse createBusiness(CreateBusinessRequest request) {
        User owner = getAuthenticatedUser();
        verifyBusinessAccount(owner);

        if (businessRepository.existsByOwner(owner)) {
            throw new BusinessAlreadyExistsException("A business listing already exists for this account.");
        }

        Business business = Business.builder()
                .name(request.name())
                .description(request.description())
                .phoneNumber(request.phoneNumber())
                .email(request.email())
                .category(request.category())
                .address(request.address())
                .city(request.city())
                .province(request.province())
                .owner(owner)
                .build();

        Business savedBusiness = businessRepository.save(business);

        return businessMapper.toBusinessResponse(savedBusiness);
    }

    @Override
    @Transactional(readOnly = true)
    public BusinessResponse getBusinessById(UUID id) {
        Business business = getBusinessByIdInternal(id);
        String coverImageUrl = getCoverImageUrl(id);
        BusinessRatingStats stats = getRatingStats(id);
        return mapToResponse(business, coverImageUrl, stats);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BusinessResponse> getAllBusinesses(String search, String category, String city, Pageable pageable) {
        Specification<Business> spec = BusinessSpecifications.withFilters(search, category, city);
        Page<Business> page = businessRepository.findAll(spec, pageable);
        Map<UUID, String> coverImageMap = getCoverImageMap(page.getContent());
        Map<UUID, BusinessRatingStats> ratingStatsMap = getRatingStatsMap(page.getContent());
        return page.map(b -> mapToResponse(b, coverImageMap.get(b.getId()), ratingStatsMap.get(b.getId())));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BusinessResponse> getAllBusinesses(Pageable pageable) {
        return getAllBusinesses(null, null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BusinessResponse> getBusinessesForCurrentUser(Pageable pageable) {
        User owner = getAuthenticatedUser();
        Page<Business> page = businessRepository.findByOwner(owner, pageable);
        Map<UUID, String> coverImageMap = getCoverImageMap(page.getContent());
        Map<UUID, BusinessRatingStats> ratingStatsMap = getRatingStatsMap(page.getContent());
        return page.map(b -> mapToResponse(b, coverImageMap.get(b.getId()), ratingStatsMap.get(b.getId())));
    }

    @Override
    @Transactional
    public BusinessResponse updateBusiness(UUID id, UpdateBusinessRequest request) {
        User owner = getAuthenticatedUser();
        verifyBusinessAccount(owner);
        Business business = getBusinessByIdInternal(id);
        verifyOwnership(business, owner);

        business.setName(request.name());
        business.setDescription(request.description());
        business.setPhoneNumber(request.phoneNumber());
        business.setEmail(request.email());
        business.setCategory(request.category());
        business.setAddress(request.address());
        business.setCity(request.city());
        business.setProvince(request.province());

        Business updatedBusiness = businessRepository.save(business);
        String coverImageUrl = getCoverImageUrl(id);
        BusinessRatingStats stats = getRatingStats(id);
        return mapToResponse(updatedBusiness, coverImageUrl, stats);
    }

    @Override
    @Transactional
    public void deleteBusiness(UUID id) {
        User owner = getAuthenticatedUser();
        verifyBusinessAccount(owner);
        Business business = getBusinessByIdInternal(id);
        verifyOwnership(business, owner);

        if (businessImageRepository != null && imageStorageService != null) {
            List<BusinessImage> images = businessImageRepository.findByBusinessId(id);
            for (BusinessImage image : images) {
                try {
                    imageStorageService.deleteImage(image.getStorageId());
                } catch (Exception ex) {
                    log.warn("Failed to delete storage asset {} during business deletion: {}",
                            image.getStorageId(), ex.getMessage());
                }
            }
        }

        businessRepository.delete(business);
    }

    private String getCoverImageUrl(UUID businessId) {
        if (businessImageRepository == null || businessId == null) {
            return null;
        }
        return businessImageRepository.findCoverImageUrlByBusinessId(businessId).orElse(null);
    }

    private Map<UUID, String> getCoverImageMap(Collection<Business> businesses) {
        Map<UUID, String> map = new HashMap<>();
        if (businessImageRepository == null || businesses == null || businesses.isEmpty()) {
            return map;
        }

        List<UUID> ids = businesses.stream().map(Business::getId).toList();
        List<Object[]> rows = businessImageRepository.findCoverImageUrlsByBusinessIds(ids);
        for (Object[] row : rows) {
            map.put((UUID) row[0], (String) row[1]);
        }
        return map;
    }

    private BusinessRatingStats getRatingStats(UUID businessId) {
        if (businessReviewRepository == null || businessId == null) {
            return null;
        }
        List<BusinessRatingStats> statsList = businessReviewRepository.findRatingStatsByBusinessIds(List.of(businessId));
        return (statsList != null && !statsList.isEmpty()) ? statsList.get(0) : null;
    }

    private Map<UUID, BusinessRatingStats> getRatingStatsMap(Collection<Business> businesses) {
        Map<UUID, BusinessRatingStats> map = new HashMap<>();
        if (businessReviewRepository == null || businesses == null || businesses.isEmpty()) {
            return map;
        }

        List<UUID> ids = businesses.stream()
                .map(Business::getId)
                .filter(Objects::nonNull)
                .toList();

        if (ids.isEmpty()) {
            return map;
        }

        List<BusinessRatingStats> statsList = businessReviewRepository.findRatingStatsByBusinessIds(ids);
        if (statsList != null) {
            for (BusinessRatingStats stats : statsList) {
                if (stats.businessId() != null) {
                    map.put(stats.businessId(), stats);
                }
            }
        }
        return map;
    }

    private BusinessResponse mapToResponse(Business business, String coverImageUrl, BusinessRatingStats stats) {
        Double avgRating = stats != null ? stats.getRoundedAverageRating() : 0.0;
        long reviewCount = (stats != null && stats.reviewCount() != null) ? stats.reviewCount() : 0L;

        BusinessResponse response = coverImageUrl != null
                ? businessMapper.toBusinessResponse(business, coverImageUrl)
                : businessMapper.toBusinessResponse(business);

        return response != null ? response.toBuilder()
                .averageRating(avgRating)
                .reviewCount(reviewCount)
                .build() : null;
    }

    private void verifyBusinessAccount(User user) {
        if (user.getAccountType() != AccountType.BUSINESS) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only BUSINESS accounts can create, update, or delete businesses.");
        }
    }

    private Business getBusinessByIdInternal(UUID id) {
        return businessRepository.findById(id)
                .orElseThrow(() -> new BusinessNotFoundException("Business with ID " + id + " not found."));
    }

    private void verifyOwnership(Business business, User owner) {
        if (business.getOwner() == null || business.getOwner().getId() == null || owner.getId() == null ||
                !business.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to modify this business.");
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

