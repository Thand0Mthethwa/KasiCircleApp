package com.kasicircle.backend.businesses.mapper;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.dto.BusinessResponse;
import org.springframework.stereotype.Component;

@Component
public class BusinessMapper {

    public BusinessResponse toBusinessResponse(Business business, String coverImageUrl) {
        return BusinessResponse.builder()
                .id(business.getId())
                .name(business.getName())
                .description(business.getDescription())
                .phoneNumber(business.getPhoneNumber())
                .email(business.getEmail())
                .category(business.getCategory())
                .address(business.getAddress())
                .city(business.getCity())
                .province(business.getProvince())
                .ownerId(business.getOwner() != null ? business.getOwner().getId() : null)
                .createdAt(business.getCreatedAt())
                .updatedAt(business.getUpdatedAt())
                .coverImageUrl(coverImageUrl)
                .build();
    }

    public BusinessResponse toBusinessResponse(Business business) {
        return toBusinessResponse(business, null);
    }
}
