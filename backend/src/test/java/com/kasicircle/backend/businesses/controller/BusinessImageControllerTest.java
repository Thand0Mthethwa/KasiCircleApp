package com.kasicircle.backend.businesses.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kasicircle.backend.businesses.dto.BusinessImageResponse;
import com.kasicircle.backend.businesses.exception.BusinessNotFoundException;
import com.kasicircle.backend.businesses.exception.ImageNotFoundException;
import com.kasicircle.backend.businesses.exception.ImageQuotaExceededException;
import com.kasicircle.backend.businesses.exception.InvalidImageException;
import com.kasicircle.backend.businesses.service.BusinessImageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BusinessImageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BusinessImageService businessImageService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "owner@business.com")
    void uploadImage_withValidFileAndAuth_shouldReturnCreated() throws Exception {
        UUID businessId = UUID.randomUUID();
        UUID imageId = UUID.randomUUID();

        MockMultipartFile file = new MockMultipartFile(
                "file", "cover.jpg", "image/jpeg", new byte[]{1, 2, 3}
        );

        BusinessImageResponse response = BusinessImageResponse.builder()
                .id(imageId)
                .businessId(businessId)
                .imageUrl("https://res.cloudinary.com/test/cover.jpg")
                .storageId("kasicircle/businesses/" + businessId + "/cover")
                .fileName("cover.jpg")
                .contentType("image/jpeg")
                .fileSize(3L)
                .isCover(true)
                .sortOrder(0)
                .createdAt(Instant.now())
                .build();

        when(businessImageService.uploadImage(eq(businessId), any(), eq(false))).thenReturn(response);

        mockMvc.perform(multipart("/api/businesses/{businessId}/images", businessId)
                        .file(file))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(imageId.toString()))
                .andExpect(jsonPath("$.businessId").value(businessId.toString()))
                .andExpect(jsonPath("$.imageUrl").value("https://res.cloudinary.com/test/cover.jpg"))
                .andExpect(jsonPath("$.isCover").value(true));
    }

    @Test
    @WithAnonymousUser
    void uploadImage_withoutAuth_shouldReturnUnauthorized() throws Exception {
        UUID businessId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file", "cover.jpg", "image/jpeg", new byte[]{1, 2, 3}
        );

        mockMvc.perform(multipart("/api/businesses/{businessId}/images", businessId)
                        .file(file))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "resident@example.com")
    void uploadImage_asNonOwner_shouldReturnForbidden() throws Exception {
        UUID businessId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file", "cover.jpg", "image/jpeg", new byte[]{1, 2, 3}
        );

        when(businessImageService.uploadImage(eq(businessId), any(), anyBoolean()))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Only BUSINESS accounts can manage business images."));

        mockMvc.perform(multipart("/api/businesses/{businessId}/images", businessId)
                        .file(file))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "owner@business.com")
    void uploadImage_invalidContent_shouldReturnBadRequest() throws Exception {
        UUID businessId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file", "invalid.txt", "text/plain", "plain text".getBytes()
        );

        when(businessImageService.uploadImage(eq(businessId), any(), anyBoolean()))
                .thenThrow(new InvalidImageException("Unsupported image format. Allowed formats are JPEG, PNG, and WebP."));

        mockMvc.perform(multipart("/api/businesses/{businessId}/images", businessId)
                        .file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Unsupported image format. Allowed formats are JPEG, PNG, and WebP."));
    }

    @Test
    @WithMockUser(username = "owner@business.com")
    void uploadImage_exceedingQuota_shouldReturnBadRequest() throws Exception {
        UUID businessId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file", "pic.jpg", "image/jpeg", new byte[]{1, 2, 3}
        );

        when(businessImageService.uploadImage(eq(businessId), any(), anyBoolean()))
                .thenThrow(new ImageQuotaExceededException("Maximum limit of 10 images reached for this business."));

        mockMvc.perform(multipart("/api/businesses/{businessId}/images", businessId)
                        .file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Maximum limit of 10 images reached for this business."));
    }

    @Test
    @WithAnonymousUser
    void getImagesForBusiness_publicAccess_shouldReturnOk() throws Exception {
        UUID businessId = UUID.randomUUID();
        UUID imageId = UUID.randomUUID();

        BusinessImageResponse img = BusinessImageResponse.builder()
                .id(imageId)
                .businessId(businessId)
                .imageUrl("https://res.cloudinary.com/test/photo.jpg")
                .isCover(true)
                .build();

        when(businessImageService.getImagesForBusiness(businessId)).thenReturn(List.of(img));

        mockMvc.perform(get("/api/businesses/{businessId}/images", businessId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(imageId.toString()))
                .andExpect(jsonPath("$[0].imageUrl").value("https://res.cloudinary.com/test/photo.jpg"))
                .andExpect(jsonPath("$[0].isCover").value(true));
    }

    @Test
    @WithAnonymousUser
    void getImagesForBusiness_nonexistentBusiness_shouldReturnNotFound() throws Exception {
        UUID businessId = UUID.randomUUID();

        when(businessImageService.getImagesForBusiness(businessId))
                .thenThrow(new BusinessNotFoundException("Business with ID " + businessId + " not found."));

        mockMvc.perform(get("/api/businesses/{businessId}/images", businessId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @WithMockUser(username = "owner@business.com")
    void deleteImage_asOwner_shouldReturnNoContent() throws Exception {
        UUID businessId = UUID.randomUUID();
        UUID imageId = UUID.randomUUID();

        doNothing().when(businessImageService).deleteImage(businessId, imageId);

        mockMvc.perform(delete("/api/businesses/{businessId}/images/{imageId}", businessId, imageId))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithAnonymousUser
    void deleteImage_withoutAuth_shouldReturnUnauthorized() throws Exception {
        UUID businessId = UUID.randomUUID();
        UUID imageId = UUID.randomUUID();

        mockMvc.perform(delete("/api/businesses/{businessId}/images/{imageId}", businessId, imageId))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "owner@business.com")
    void deleteImage_imageNotFound_shouldReturnNotFound() throws Exception {
        UUID businessId = UUID.randomUUID();
        UUID imageId = UUID.randomUUID();

        doThrow(new ImageNotFoundException("Image with ID " + imageId + " not found."))
                .when(businessImageService).deleteImage(businessId, imageId);

        mockMvc.perform(delete("/api/businesses/{businessId}/images/{imageId}", businessId, imageId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @WithMockUser(username = "owner@business.com")
    void setCoverImage_asOwner_shouldReturnOk() throws Exception {
        UUID businessId = UUID.randomUUID();
        UUID imageId = UUID.randomUUID();

        BusinessImageResponse response = BusinessImageResponse.builder()
                .id(imageId)
                .businessId(businessId)
                .imageUrl("https://res.cloudinary.com/test/newcover.jpg")
                .isCover(true)
                .build();

        when(businessImageService.setCoverImage(businessId, imageId)).thenReturn(response);

        mockMvc.perform(put("/api/businesses/{businessId}/images/{imageId}/cover", businessId, imageId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(imageId.toString()))
                .andExpect(jsonPath("$.isCover").value(true));
    }

    @Test
    @WithAnonymousUser
    void setCoverImage_withoutAuth_shouldReturnUnauthorized() throws Exception {
        UUID businessId = UUID.randomUUID();
        UUID imageId = UUID.randomUUID();

        mockMvc.perform(put("/api/businesses/{businessId}/images/{imageId}/cover", businessId, imageId))
                .andExpect(status().isUnauthorized());
    }
}

