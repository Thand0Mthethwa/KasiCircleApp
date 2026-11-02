package com.kasicircle.backend.businesses.mapper;

import com.kasicircle.backend.businesses.domain.BusinessImage;
import com.kasicircle.backend.businesses.dto.BusinessImageResponse;
import org.springframework.stereotype.Component;

@Component
public class BusinessImageMapper {

    public BusinessImageResponse toResponse(BusinessImage image) {
        if (image == null) {
            return null;
        }

        return BusinessImageResponse.builder()
                .id(image.getId())
                .businessId(image.getBusiness() != null ? image.getBusiness().getId() : null)
                .imageUrl(image.getImageUrl())
                .storageId(image.getStorageId())
                .fileName(image.getFileName())
                .contentType(image.getContentType())
                .fileSize(image.getFileSize())
                .isCover(image.getIsCover())
                .sortOrder(image.getSortOrder())
                .createdAt(image.getCreatedAt())
                .build();
    }
}

