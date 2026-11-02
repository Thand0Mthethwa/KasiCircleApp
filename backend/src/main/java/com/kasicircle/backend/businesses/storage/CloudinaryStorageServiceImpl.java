package com.kasicircle.backend.businesses.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class CloudinaryStorageServiceImpl implements ImageStorageService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryStorageServiceImpl.class);

    private final Cloudinary cloudinary;
    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public CloudinaryStorageServiceImpl(
            Cloudinary cloudinary,
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret
    ) {
        this.cloudinary = cloudinary;
        this.cloudName = cloudName != null ? cloudName.trim() : "";
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.apiSecret = apiSecret != null ? apiSecret.trim() : "";
    }

    @Override
    public ImageUploadResult uploadImage(MultipartFile file, String folder) {
        validateCredentials();

        String publicId = (folder != null && !folder.isBlank() ? folder.replaceAll("/+$", "") + "/" : "")
                + UUID.randomUUID();

        try {
            Map<String, Object> params = ObjectUtils.asMap(
                    "public_id", publicId,
                    "overwrite", true,
                    "resource_type", "image"
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);

            String secureUrl = (String) uploadResult.get("secure_url");
            String returnedPublicId = (String) uploadResult.get("public_id");

            if (secureUrl == null || returnedPublicId == null) {
                throw new StorageException("Cloudinary upload succeeded but returned an incomplete response.");
            }

            log.info("Successfully uploaded image to Cloudinary: {}", returnedPublicId);
            return new ImageUploadResult(secureUrl, returnedPublicId);
        } catch (IOException ex) {
            log.error("IO error uploading image to Cloudinary", ex);
            throw new StorageException("Failed to upload image to Cloudinary due to IO error: " + ex.getMessage(), ex);
        } catch (Exception ex) {
            log.error("Cloudinary upload failed", ex);
            throw new StorageException("Failed to upload image to Cloudinary: " + ex.getMessage(), ex);
        }
    }

    @Override
    public void deleteImage(String storageId) {
        validateCredentials();

        if (storageId == null || storageId.isBlank()) {
            return;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().destroy(storageId, ObjectUtils.emptyMap());
            String status = (String) result.get("result");

            if ("ok".equalsIgnoreCase(status) || "not found".equalsIgnoreCase(status)) {
                log.info("Successfully deleted image from Cloudinary: {}", storageId);
            } else {
                log.error("Cloudinary returned non-success status when deleting image {}: {}", storageId, status);
                throw new StorageException("Failed to delete image from Cloudinary: " + status);
            }
        } catch (StorageException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Error deleting image from Cloudinary: {}", storageId, ex);
            throw new StorageException("Failed to delete image from Cloudinary: " + ex.getMessage(), ex);
        }
    }

    private void validateCredentials() {
        if (cloudName.isEmpty() || apiKey.isEmpty() || apiSecret.isEmpty()) {
            throw new StorageException(
                    "Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, " +
                    "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables."
            );
        }
    }
}

