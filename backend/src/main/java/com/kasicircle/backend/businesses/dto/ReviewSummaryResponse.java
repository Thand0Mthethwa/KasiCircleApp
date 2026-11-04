package com.kasicircle.backend.businesses.dto;

import lombok.Builder;

import java.util.UUID;

/**
 * Summary representation of a business's aggregate rating and star distribution.
 */
@Builder
public record ReviewSummaryResponse(
        UUID businessId,
        Double averageRating,
        long totalReviews,
        long fiveStarCount,
        long fourStarCount,
        long threeStarCount,
        long twoStarCount,
        long oneStarCount
) {
}

