package com.kasicircle.backend.businesses.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record BusinessImageResponse(
        UUID id,
        UUID businessId,
        String imageUrl,
        String storageId,
        String fileName,
        String contentType,
        Long fileSize,
        Boolean isCover,
        Integer sortOrder,
        Instant createdAt
) {
}

