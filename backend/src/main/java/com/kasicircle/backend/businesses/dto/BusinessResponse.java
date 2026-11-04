package com.kasicircle.backend.businesses.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Builder(toBuilder = true)
public record BusinessResponse(
        UUID id,
        String name,
        String description,
        String phoneNumber,
        String email,
        String category,
        String address,
        String city,
        String province,
        UUID ownerId,
        Instant createdAt,
        Instant updatedAt,
        String coverImageUrl,
        Double averageRating,
        long reviewCount
) {
    public BusinessResponse {
        if (averageRating == null) {
            averageRating = 0.0;
        } else if (averageRating > 0.0) {
            averageRating = BigDecimal.valueOf(averageRating)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        }
    }
}
