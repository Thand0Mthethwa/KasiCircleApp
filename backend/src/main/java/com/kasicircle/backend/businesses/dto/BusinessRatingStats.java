package com.kasicircle.backend.businesses.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/**
 * Data transfer object / projection holding aggregated review statistics
 * (average rating and review count) for a specific business.
 */
@Builder
public record BusinessRatingStats(
        UUID businessId,
        Double averageRating,
        Long reviewCount
) {
    /**
     * Compact constructor handling null values.
     */
    public BusinessRatingStats {
        if (averageRating == null) {
            averageRating = 0.0;
        }
        if (reviewCount == null) {
            reviewCount = 0L;
        }
    }

    /**
     * Returns the average rating rounded consistently to one decimal place.
     * Defaults to 0.0 if there are no reviews or the average rating is 0.
     *
     * @return Average rating rounded to 1 decimal place.
     */
    public Double getRoundedAverageRating() {
        if (averageRating == null || reviewCount == null || reviewCount == 0L || averageRating == 0.0) {
            return 0.0;
        }
        return BigDecimal.valueOf(averageRating)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }
}

