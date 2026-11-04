package com.kasicircle.backend.businesses.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

/**
 * Public response representation of a business rating and customer review.
 * Excludes sensitive personal information such as email addresses or phone numbers.
 */
@Builder
public record ReviewResponse(
        UUID id,
        UUID businessId,
        Integer rating,
        String comment,
        String authorName,
        Instant createdAt,
        Instant updatedAt
) {
}

