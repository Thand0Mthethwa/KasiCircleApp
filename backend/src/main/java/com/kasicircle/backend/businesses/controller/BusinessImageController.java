package com.kasicircle.backend.businesses.controller;

import com.kasicircle.backend.businesses.dto.BusinessImageResponse;
import com.kasicircle.backend.businesses.service.BusinessImageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/businesses/{businessId}/images")
public class BusinessImageController {

    private final BusinessImageService businessImageService;

    public BusinessImageController(BusinessImageService businessImageService) {
        this.businessImageService = businessImageService;
    }

    /**
     * Uploads an image for the specified business.
     * Accessible only by the authenticated BUSINESS owner of the business.
     *
     * @param businessId The UUID of the business.
     * @param file The multipart image file.
     * @param isCover Optional flag indicating if this image should be the cover photo.
     * @return 201 Created with the uploaded image metadata.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BusinessImageResponse> uploadImage(
            @PathVariable UUID businessId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "isCover", required = false, defaultValue = "false") boolean isCover
    ) {
        BusinessImageResponse response = businessImageService.uploadImage(businessId, file, isCover);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Retrieves all images for the specified business gallery.
     * Publicly accessible by all users and anonymous visitors.
     *
     * @param businessId The UUID of the business.
     * @return 200 OK with list of business images with cover photo first.
     */
    @GetMapping
    public ResponseEntity<List<BusinessImageResponse>> getImagesForBusiness(@PathVariable UUID businessId) {
        List<BusinessImageResponse> images = businessImageService.getImagesForBusiness(businessId);
        return ResponseEntity.ok(images);
    }

    /**
     * Deletes an image for the specified business.
     * Accessible only by the authenticated BUSINESS owner of the business.
     *
     * @param businessId The UUID of the business.
     * @param imageId The UUID of the image to delete.
     * @return 204 No Content.
     */
    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable UUID businessId,
            @PathVariable UUID imageId
    ) {
        businessImageService.deleteImage(businessId, imageId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Sets the specified image as the cover photo for the business.
     * Accessible only by the authenticated BUSINESS owner of the business.
     *
     * @param businessId The UUID of the business.
     * @param imageId The UUID of the image to designate as cover.
     * @return 200 OK with the updated image metadata.
     */
    @PutMapping("/{imageId}/cover")
    public ResponseEntity<BusinessImageResponse> setCoverImage(
            @PathVariable UUID businessId,
            @PathVariable UUID imageId
    ) {
        BusinessImageResponse response = businessImageService.setCoverImage(businessId, imageId);
        return ResponseEntity.ok(response);
    }
}

