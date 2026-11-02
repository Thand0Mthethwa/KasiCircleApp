package com.kasicircle.backend.businesses.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CloudinaryStorageServiceImplTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    private CloudinaryStorageServiceImpl storageService;

    @BeforeEach
    void setUp() {
        storageService = new CloudinaryStorageServiceImpl(
                cloudinary,
                "test-cloud",
                "test-api-key",
                "test-api-secret"
        );
    }

    @Test
    void uploadImage_withValidCredentials_shouldReturnUploadResult() throws Exception {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(Map.of(
                "secure_url", "https://res.cloudinary.com/test-cloud/image/upload/v1/sample.jpg",
                "public_id", "kasicircle/businesses/123/sample"
        ));

        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", "image/jpeg", new byte[]{1, 2, 3}
        );

        ImageUploadResult result = storageService.uploadImage(file, "kasicircle/businesses/123");

        assertNotNull(result);
        assertEquals("https://res.cloudinary.com/test-cloud/image/upload/v1/sample.jpg", result.imageUrl());
        assertEquals("kasicircle/businesses/123/sample", result.storageId());
        verify(uploader).upload(any(byte[].class), anyMap());
    }

    @Test
    void uploadImage_missingCredentials_shouldThrowStorageException() {
        CloudinaryStorageServiceImpl unconfiguredService = new CloudinaryStorageServiceImpl(
                cloudinary, "", "", ""
        );

        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", "image/jpeg", new byte[]{1, 2, 3}
        );

        StorageException ex = assertThrows(StorageException.class,
                () -> unconfiguredService.uploadImage(file, "folder"));
        assertTrue(ex.getMessage().contains("Cloudinary credentials are not configured"));
        verifyNoInteractions(cloudinary);
    }

    @Test
    void uploadImage_cloudinaryThrowsException_shouldWrapInStorageException() throws Exception {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenThrow(new IOException("Network timeout"));

        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", "image/jpeg", new byte[]{1, 2, 3}
        );

        StorageException ex = assertThrows(StorageException.class,
                () -> storageService.uploadImage(file, "folder"));
        assertTrue(ex.getMessage().contains("Failed to upload image to Cloudinary"));
    }

    @Test
    void deleteImage_withValidCredentials_shouldInvokeDestroy() throws Exception {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.destroy(eq("kasicircle/sample"), anyMap())).thenReturn(Map.of("result", "ok"));

        assertDoesNotThrow(() -> storageService.deleteImage("kasicircle/sample"));
        verify(uploader).destroy(eq("kasicircle/sample"), anyMap());
    }

    @Test
    void deleteImage_withNotFoundStatus_shouldNotThrowException() throws Exception {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.destroy(eq("kasicircle/sample"), anyMap())).thenReturn(Map.of("result", "not found"));

        assertDoesNotThrow(() -> storageService.deleteImage("kasicircle/sample"));
        verify(uploader).destroy(eq("kasicircle/sample"), anyMap());
    }

    @Test
    void deleteImage_withErrorStatus_shouldThrowStorageException() throws Exception {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.destroy(eq("kasicircle/sample"), anyMap())).thenReturn(Map.of("result", "error"));

        StorageException ex = assertThrows(StorageException.class,
                () -> storageService.deleteImage("kasicircle/sample"));
        assertTrue(ex.getMessage().contains("Failed to delete image from Cloudinary"));
    }

    @Test
    void deleteImage_missingCredentials_shouldThrowStorageException() {
        CloudinaryStorageServiceImpl unconfiguredService = new CloudinaryStorageServiceImpl(
                cloudinary, "", "", ""
        );

        StorageException ex = assertThrows(StorageException.class,
                () -> unconfiguredService.deleteImage("kasicircle/sample"));
        assertTrue(ex.getMessage().contains("Cloudinary credentials are not configured"));
    }
}

