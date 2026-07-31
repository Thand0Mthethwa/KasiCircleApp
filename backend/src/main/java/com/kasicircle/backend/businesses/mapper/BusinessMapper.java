package com.kasicircle.backend.businesses.mapper;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.dto.BusinessResponse;
import org.springframework.stereotype.Component;

@Component
public class BusinessMapper {

    public BusinessResponse toBusinessResponse(Business business) {
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
                .ownerId(business.getOwner().getId())
                .createdAt(business.getCreatedAt())
                .updatedAt(business.getUpdatedAt())
                .build();
    }
}
