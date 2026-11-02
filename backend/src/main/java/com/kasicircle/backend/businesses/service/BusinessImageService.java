package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.dto.BusinessImageResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface BusinessImageService {

    BusinessImageResponse uploadImage(UUID businessId, MultipartFile file, boolean isCover);

    List<BusinessImageResponse> getImagesForBusiness(UUID businessId);

    void deleteImage(UUID businessId, UUID imageId);

    BusinessImageResponse setCoverImage(UUID businessId, UUID imageId);
}

