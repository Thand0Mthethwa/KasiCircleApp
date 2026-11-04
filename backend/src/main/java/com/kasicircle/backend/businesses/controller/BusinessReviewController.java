package com.kasicircle.backend.businesses.controller;

import com.kasicircle.backend.businesses.dto.CreateReviewRequest;
import com.kasicircle.backend.businesses.dto.ReviewResponse;
import com.kasicircle.backend.businesses.dto.ReviewSummaryResponse;
import com.kasicircle.backend.businesses.dto.UpdateReviewRequest;
import com.kasicircle.backend.businesses.service.BusinessReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for managing customer ratings and reviews for businesses.
 */
@RestController
@RequestMapping("/api/businesses/{businessId}/reviews")
public class BusinessReviewController {

    private final BusinessReviewService reviewService;

    public BusinessReviewController(BusinessReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /**
     * Retrieves a paginated list of reviews for the specified business.
     * Publicly accessible by all users and anonymous visitors.
     *
     * @param businessId The UUID of the business.
     * @param pageable Pagination and sorting criteria (defaults to page 0, size 10, newest first).
     * @return 200 OK with Page of ReviewResponse.
     */
    @GetMapping
    public ResponseEntity<Page<ReviewResponse>> getReviewsForBusiness(
            @PathVariable UUID businessId,
            @PageableDefault(page = 0, size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<ReviewResponse> response = reviewService.getReviewsForBusiness(businessId, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves the aggregate rating summary and star distribution for the specified business.
     * Publicly accessible by all users and anonymous visitors.
     *
     * @param businessId The UUID of the business.
     * @return 200 OK with ReviewSummaryResponse.
     */
    @GetMapping("/summary")
    public ResponseEntity<ReviewSummaryResponse> getRatingSummary(@PathVariable UUID businessId) {
        ReviewSummaryResponse response = reviewService.getRatingSummary(businessId);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves the authenticated user's review for the specified business.
     * Requires authentication.
     *
     * @param businessId The UUID of the business.
     * @return 200 OK with ReviewResponse if present, or 204 No Content if not found.
     */
    @GetMapping("/me")
    public ResponseEntity<ReviewResponse> getMyReviewForBusiness(@PathVariable UUID businessId) {
        return reviewService.getMyReviewForBusiness(businessId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * Submits a customer review for the specified business.
     * Accessible only by authenticated users.
     *
     * @param businessId The UUID of the business.
     * @param request The review payload containing rating and optional comment.
     * @return 201 Created with the created ReviewResponse.
     */
    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable UUID businessId,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        ReviewResponse response = reviewService.createReview(businessId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Updates an existing review for the specified business.
     * Accessible only by the authenticated author of the review.
     *
     * @param businessId The UUID of the business.
     * @param reviewId The UUID of the review to update.
     * @param request The update payload containing new rating and optional comment.
     * @return 200 OK with the updated ReviewResponse.
     */
    @PutMapping("/{reviewId}")
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable UUID businessId,
            @PathVariable UUID reviewId,
            @Valid @RequestBody UpdateReviewRequest request
    ) {
        ReviewResponse response = reviewService.updateReview(businessId, reviewId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes a review for the specified business.
     * Accessible by the authenticated author of the review or an ADMIN.
     *
     * @param businessId The UUID of the business.
     * @param reviewId The UUID of the review to delete.
     * @return 204 No Content.
     */
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable UUID businessId,
            @PathVariable UUID reviewId
    ) {
        reviewService.deleteReview(businessId, reviewId);
        return ResponseEntity.noContent().build();
    }
}

