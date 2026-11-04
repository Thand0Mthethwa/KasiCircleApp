package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.dto.CreateReviewRequest;
import com.kasicircle.backend.businesses.dto.ReviewResponse;
import com.kasicircle.backend.businesses.dto.ReviewSummaryResponse;
import com.kasicircle.backend.businesses.dto.UpdateReviewRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for customer business ratings and reviews.
 */
public interface BusinessReviewService {

    /**
     * Submits a customer review and rating for the specified business.
     *
     * @param businessId The UUID of the business.
     * @param request The review payload containing rating and optional comment.
     * @return The created ReviewResponse.
     */
    ReviewResponse createReview(UUID businessId, CreateReviewRequest request);

    /**
     * Updates an existing review. Can only be performed by the original author.
     *
     * @param businessId The UUID of the business.
     * @param reviewId The UUID of the review to update.
     * @param request The update payload containing new rating and optional comment.
     * @return The updated ReviewResponse.
     */
    ReviewResponse updateReview(UUID businessId, UUID reviewId, UpdateReviewRequest request);

    /**
     * Deletes a review. Can be performed by the author or an ADMIN.
     *
     * @param businessId The UUID of the business.
     * @param reviewId The UUID of the review to delete.
     */
    void deleteReview(UUID businessId, UUID reviewId);

    /**
     * Retrieves a paginated page of reviews for the specified business.
     *
     * @param businessId The UUID of the business.
     * @param pageable Pagination and sorting criteria.
     * @return A page of ReviewResponse objects.
     */
    Page<ReviewResponse> getReviewsForBusiness(UUID businessId, Pageable pageable);

    /**
     * Retrieves all reviews for the specified business ordered newest first.
     *
     * @param businessId The UUID of the business.
     * @return A list of ReviewResponse objects.
     */
    List<ReviewResponse> getReviewsForBusiness(UUID businessId);

    /**
     * Retrieves the current authenticated user's review for the specified business, if present.
     *
     * @param businessId The UUID of the business.
     * @return An Optional containing the ReviewResponse if the user reviewed this business.
     */
    Optional<ReviewResponse> getMyReviewForBusiness(UUID businessId);

    /**
     * Calculates the aggregate rating summary and star distribution for a business.
     *
     * @param businessId The UUID of the business.
     * @return The ReviewSummaryResponse containing average rating, total count, and 1-5 star breakdown.
     */
    ReviewSummaryResponse getRatingSummary(UUID businessId);
}

