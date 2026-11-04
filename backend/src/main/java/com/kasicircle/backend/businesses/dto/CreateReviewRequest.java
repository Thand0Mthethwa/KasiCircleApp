package com.kasicircle.backend.businesses.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

/**
 * Request payload for creating a business rating and customer review.
 */
@Builder
public record CreateReviewRequest(
        @NotNull(message = "Rating is required.")
        @Min(value = 1, message = "Rating must be at least 1.")
        @Max(value = 5, message = "Rating cannot exceed 5.")
        Integer rating,

        @Size(max = 1000, message = "Comment cannot exceed 1000 characters.")
        String comment
) {
}

