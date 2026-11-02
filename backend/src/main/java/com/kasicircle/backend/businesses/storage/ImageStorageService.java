package com.kasicircle.backend.businesses.storage;

import org.springframework.web.multipart.MultipartFile;

public interface ImageStorageService {

    /**
     * Uploads an image to cloud storage.
     *
     * @param file The validated image file.
     * @param folder The storage folder or prefix.
     * @return ImageUploadResult containing the secure URL and unique storage identifier.
     */
    ImageUploadResult uploadImage(MultipartFile file, String folder);

    /**
     * Deletes an image from cloud storage using its storage identifier.
     *
     * @param storageId The unique storage identifier.
     */
    void deleteImage(String storageId);
}

