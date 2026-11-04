package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.domain.BusinessReview;
import com.kasicircle.backend.businesses.dto.CreateReviewRequest;
import com.kasicircle.backend.businesses.dto.ReviewResponse;
import com.kasicircle.backend.businesses.dto.ReviewSummaryResponse;
import com.kasicircle.backend.businesses.dto.UpdateReviewRequest;
import com.kasicircle.backend.businesses.exception.BusinessNotFoundException;
import com.kasicircle.backend.businesses.exception.ReviewAlreadyExistsException;
import com.kasicircle.backend.businesses.exception.ReviewNotFoundException;
import com.kasicircle.backend.businesses.repository.BusinessRepository;
import com.kasicircle.backend.businesses.repository.BusinessReviewRepository;
import com.kasicircle.backend.users.entity.Role;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.exception.UserNotFoundException;
import com.kasicircle.backend.users.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Service implementation for managing business reviews, ratings, and summaries.
 */
@Service
public class BusinessReviewServiceImpl implements BusinessReviewService {

    private final BusinessReviewRepository reviewRepository;
    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;

    public BusinessReviewServiceImpl(
            BusinessReviewRepository reviewRepository,
            BusinessRepository businessRepository,
            UserRepository userRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public ReviewResponse createReview(UUID businessId, CreateReviewRequest request) {
        User author = getAuthenticatedUser();
        Business business = getBusinessByIdInternal(businessId);

        // 1. Business owners cannot review their own business
        if (business.getOwner() != null && business.getOwner().getId() != null &&
                business.getOwner().getId().equals(author.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Business owners cannot review their own business.");
        }

        // 2. Prevent duplicate reviews (one review per user per business)
        if (reviewRepository.existsByBusinessIdAndAuthorId(businessId, author.getId())) {
            throw new ReviewAlreadyExistsException("You have already reviewed this business. You can update your existing review.");
        }

        // 3. Validation & sanitation
        validateRating(request.rating());
        String sanitizedComment = sanitizeComment(request.comment());

        BusinessReview review = BusinessReview.builder()
                .business(business)
                .author(author)
                .rating(request.rating())
                .comment(sanitizedComment)
                .build();

        BusinessReview saved = reviewRepository.save(review);
        return toReviewResponse(saved);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(UUID businessId, UUID reviewId, UpdateReviewRequest request) {
        User user = getAuthenticatedUser();
        getBusinessByIdInternal(businessId);

        BusinessReview review = getReviewByIdAndBusinessIdInternal(reviewId, businessId);

        // A user may edit only their own review
        if (!review.getAuthor().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to edit this review.");
        }

        validateRating(request.rating());
        String sanitizedComment = sanitizeComment(request.comment());

        review.setRating(request.rating());
        review.setComment(sanitizedComment);

        BusinessReview updated = reviewRepository.save(review);
        return toReviewResponse(updated);
    }

    @Override
    @Transactional
    public void deleteReview(UUID businessId, UUID reviewId) {
        User user = getAuthenticatedUser();
        getBusinessByIdInternal(businessId);

        BusinessReview review = getReviewByIdAndBusinessIdInternal(reviewId, businessId);

        // A user may delete only their own review, but an ADMIN may moderate/delete any review.
        // Business owners cannot delete customer reviews of their own business.
        boolean isAuthor = review.getAuthor().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to delete this review.");
        }

        reviewRepository.delete(review);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsForBusiness(UUID businessId, Pageable pageable) {
        getBusinessByIdInternal(businessId);
        Page<BusinessReview> reviews = reviewRepository.findByBusinessId(businessId, pageable);
        return reviews.map(this::toReviewResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsForBusiness(UUID businessId) {
        getBusinessByIdInternal(businessId);
        List<BusinessReview> reviews = reviewRepository.findByBusinessIdOrderByCreatedAtDesc(businessId);
        return reviews.stream().map(this::toReviewResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ReviewResponse> getMyReviewForBusiness(UUID businessId) {
        getBusinessByIdInternal(businessId);
        Optional<User> userOpt = getAuthenticatedUserOptional();
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }
        return reviewRepository.findByBusinessIdAndAuthorId(businessId, userOpt.get().getId())
                .map(this::toReviewResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewSummaryResponse getRatingSummary(UUID businessId) {
        getBusinessByIdInternal(businessId);

        List<Object[]> rows = reviewRepository.countReviewsGroupedByRating(businessId);
        Map<Integer, Long> counts = new HashMap<>();
        for (int star = 1; star <= 5; star++) {
            counts.put(star, 0L);
        }

        long total = 0L;
        long weightedSum = 0L;

        for (Object[] row : rows) {
            int rating = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            if (rating >= 1 && rating <= 5) {
                counts.put(rating, count);
                total += count;
                weightedSum += (long) rating * count;
            }
        }

        Double average = total > 0
                ? BigDecimal.valueOf((double) weightedSum / total)
                        .setScale(2, RoundingMode.HALF_UP)
                        .doubleValue()
                : 0.0;

        return ReviewSummaryResponse.builder()
                .businessId(businessId)
                .averageRating(average)
                .totalReviews(total)
                .fiveStarCount(counts.get(5))
                .fourStarCount(counts.get(4))
                .threeStarCount(counts.get(3))
                .twoStarCount(counts.get(2))
                .oneStarCount(counts.get(1))
                .build();
    }

    private Business getBusinessByIdInternal(UUID id) {
        return businessRepository.findById(id)
                .orElseThrow(() -> new BusinessNotFoundException("Business with ID " + id + " not found."));
    }

    private BusinessReview getReviewByIdAndBusinessIdInternal(UUID reviewId, UUID businessId) {
        BusinessReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ReviewNotFoundException("Review with ID " + reviewId + " not found."));

        if (!review.getBusiness().getId().equals(businessId)) {
            throw new ReviewNotFoundException("Review with ID " + reviewId + " does not belong to business " + businessId + ".");
        }
        return review;
    }

    private void validateRating(Integer rating) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5.");
        }
    }

    private String sanitizeComment(String comment) {
        if (comment == null) {
            return null;
        }
        String trimmed = comment.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment cannot exceed 1000 characters.");
        }
        return trimmed;
    }

    private ReviewResponse toReviewResponse(BusinessReview review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .businessId(review.getBusiness().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .authorName(formatSafeAuthorName(review.getAuthor()))
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    private String formatSafeAuthorName(User author) {
        if (author == null) {
            return "Anonymous";
        }
        String firstName = author.getFirstName() != null ? author.getFirstName().trim() : "";
        String lastName = author.getLastName() != null ? author.getLastName().trim() : "";

        if (!firstName.isEmpty() && !lastName.isEmpty()) {
            return firstName + " " + Character.toUpperCase(lastName.charAt(0)) + ".";
        }
        if (!firstName.isEmpty()) {
            return firstName;
        }
        return "KasiCircle Member";
    }

    private User getAuthenticatedUser() {
        String email = getAuthenticatedUserEmail();
        if (email == null || "anonymousUser".equalsIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found"));
    }

    private Optional<User> getAuthenticatedUserOptional() {
        String email = getAuthenticatedUserEmail();
        if (email == null || "anonymousUser".equalsIgnoreCase(email)) {
            return Optional.empty();
        }
        return userRepository.findByEmail(email);
    }

    private String getAuthenticatedUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal != null ? principal.toString() : null;
    }
}

