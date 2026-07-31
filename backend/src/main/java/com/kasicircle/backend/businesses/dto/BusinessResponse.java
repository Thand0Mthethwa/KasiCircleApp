package com.kasicircle.backend.businesses.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
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
        Instant updatedAt
) {
}
