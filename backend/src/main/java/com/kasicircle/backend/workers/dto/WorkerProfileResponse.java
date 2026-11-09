package com.kasicircle.backend.workers.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record WorkerProfileResponse(
        UUID id,
        UUID ownerId,
        String displayName,
        String headline,
        String bio,
        Set<String> skills,
        Set<String> serviceCategories,
        String city,
        String province,
        Instant createdAt,
        Instant updatedAt
) {
}
