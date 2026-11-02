package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.domain.BusinessImage;
import com.kasicircle.backend.businesses.dto.BusinessImageResponse;
import com.kasicircle.backend.businesses.exception.BusinessNotFoundException;
import com.kasicircle.backend.businesses.exception.ImageNotFoundException;
import com.kasicircle.backend.businesses.exception.ImageQuotaExceededException;
import com.kasicircle.backend.businesses.mapper.BusinessImageMapper;
import com.kasicircle.backend.businesses.repository.BusinessImageRepository;
import com.kasicircle.backend.businesses.repository.BusinessRepository;
import com.kasicircle.backend.businesses.storage.ImageStorageService;
import com.kasicircle.backend.businesses.storage.ImageUploadResult;
import com.kasicircle.backend.businesses.storage.StorageException;
import com.kasicircle.backend.businesses.validation.ImageValidator;
import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.entity.Role;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BusinessImageServiceTest {

    @Mock
    private BusinessImageRepository businessImageRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ImageStorageService imageStorageService;

    @Mock
    private ImageValidator imageValidator;

    @Spy
    private BusinessImageMapper businessImageMapper = new BusinessImageMapper();

    @InjectMocks
    private BusinessImageServiceImpl businessImageService;

    private User businessOwner;
    private Business testBusiness;
    private UUID businessId;
    private UUID ownerId;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        businessId = UUID.randomUUID();

        businessOwner = User.builder()
                .id(ownerId)
                .email("owner@business.com")
                .firstName("John")
                .lastName("Doe")
                .accountType(AccountType.BUSINESS)
                .role(Role.USER)
                .enabled(true)
                .build();

        testBusiness = Business.builder()
                .id(businessId)
                .name("Kasi Corner Cafe")
                .description("Authentic township cafe")
                .owner(businessOwner)
                .category("Food & Beverage")
                .address("123 Vilakazi St")
                .city("Soweto")
                .province("Gauteng")
                .build();

        SecurityContextHolder.clearContext();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(businessOwner.getEmail(), null, List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void uploadImage_asFirstImage_shouldAutomaticallyBecomeCover() {
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});
        ImageValidator.ValidatedImage validated = new ImageValidator.ValidatedImage("image/jpeg", "photo.jpg", 3L);
        when(imageValidator.validate(file)).thenReturn(validated);

        when(userRepository.findByEmail("owner@business.com")).thenReturn(Optional.of(businessOwner));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(businessImageRepository.countByBusinessId(businessId)).thenReturn(0L);

        when(imageStorageService.uploadImage(eq(file), anyString()))
                .thenReturn(new ImageUploadResult("https://res.cloudinary.com/test/image.jpg", "kasicircle/businesses/img1"));

        when(businessImageRepository.save(any(BusinessImage.class))).thenAnswer(invocation -> {
            BusinessImage img = invocation.getArgument(0);
            img.setId(UUID.randomUUID());
            img.setCreatedAt(Instant.now());
            return img;
        });

        BusinessImageResponse response = businessImageService.uploadImage(businessId, file, false);

        assertNotNull(response);
        assertTrue(response.isCover(), "First image must automatically be designated as cover");
        assertEquals("https://res.cloudinary.com/test/image.jpg", response.imageUrl());
        assertEquals("kasicircle/businesses/img1", response.storageId());
        verify(businessImageRepository).unsetCoverForBusiness(businessId);
        verify(businessImageRepository).save(any(BusinessImage.class));
    }

    @Test
    void uploadImage_exceedingMax10Limit_shouldThrowImageQuotaExceededException() {
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});
        when(imageValidator.validate(file)).thenReturn(new ImageValidator.ValidatedImage("image/jpeg", "photo.jpg", 3L));
        when(userRepository.findByEmail("owner@business.com")).thenReturn(Optional.of(businessOwner));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(businessImageRepository.countByBusinessId(businessId)).thenReturn(10L);

        ImageQuotaExceededException ex = assertThrows(ImageQuotaExceededException.class,
                () -> businessImageService.uploadImage(businessId, file, false));
        assertTrue(ex.getMessage().contains("Maximum limit of 10 images reached"));
        verifyNoInteractions(imageStorageService);
    }

    @Test
    void uploadImage_databaseFailureAfterStorageUpload_shouldPerformCompensatingCleanup() {
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});
        when(imageValidator.validate(file)).thenReturn(new ImageValidator.ValidatedImage("image/jpeg", "photo.jpg", 3L));
        when(userRepository.findByEmail("owner@business.com")).thenReturn(Optional.of(businessOwner));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(businessImageRepository.countByBusinessId(businessId)).thenReturn(1L);

        when(imageStorageService.uploadImage(eq(file), anyString()))
                .thenReturn(new ImageUploadResult("https://res.cloudinary.com/test/image.jpg", "kasicircle/businesses/img-fail"));

        when(businessImageRepository.save(any(BusinessImage.class))).thenThrow(new RuntimeException("Database error"));

        assertThrows(RuntimeException.class, () -> businessImageService.uploadImage(businessId, file, false));
        verify(imageStorageService).deleteImage("kasicircle/businesses/img-fail");
    }

    @Test
    void uploadImage_storageFails_shouldNotSaveToDatabase() {
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});
        when(imageValidator.validate(file)).thenReturn(new ImageValidator.ValidatedImage("image/jpeg", "photo.jpg", 3L));
        when(userRepository.findByEmail("owner@business.com")).thenReturn(Optional.of(businessOwner));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(businessImageRepository.countByBusinessId(businessId)).thenReturn(1L);

        when(imageStorageService.uploadImage(eq(file), anyString()))
                .thenThrow(new StorageException("Cloudinary upload failed"));

        assertThrows(StorageException.class, () -> businessImageService.uploadImage(businessId, file, false));
        verify(businessImageRepository, never()).save(any());
    }

    @Test
    void uploadImage_asResident_shouldThrowForbidden() {
        User resident = User.builder()
                .id(UUID.randomUUID())
                .email("resident@user.com")
                .accountType(AccountType.RESIDENT)
                .build();
        SecurityContextHolder.clearContext();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(resident.getEmail(), null, List.of())
        );
        when(userRepository.findByEmail(resident.getEmail())).thenReturn(Optional.of(resident));
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});
        when(imageValidator.validate(file)).thenReturn(new ImageValidator.ValidatedImage("image/jpeg", "photo.jpg", 3L));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> businessImageService.uploadImage(businessId, file, false));
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void uploadImage_asWorker_shouldThrowForbidden() {
        User worker = User.builder()
                .id(UUID.randomUUID())
                .email("worker@user.com")
                .accountType(AccountType.WORKER)
                .build();
        SecurityContextHolder.clearContext();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(worker.getEmail(), null, List.of())
        );
        when(userRepository.findByEmail(worker.getEmail())).thenReturn(Optional.of(worker));
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});
        when(imageValidator.validate(file)).thenReturn(new ImageValidator.ValidatedImage("image/jpeg", "photo.jpg", 3L));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> businessImageService.uploadImage(businessId, file, false));
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void uploadImage_notBusinessOwner_shouldThrowForbidden() {
        User otherBusinessUser = User.builder()
                .id(UUID.randomUUID())
                .email("other@business.com")
                .accountType(AccountType.BUSINESS)
                .build();
        SecurityContextHolder.clearContext();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(otherBusinessUser.getEmail(), null, List.of())
        );
        when(userRepository.findByEmail(otherBusinessUser.getEmail())).thenReturn(Optional.of(otherBusinessUser));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});
        when(imageValidator.validate(file)).thenReturn(new ImageValidator.ValidatedImage("image/jpeg", "photo.jpg", 3L));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> businessImageService.uploadImage(businessId, file, false));
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void getImagesForBusiness_publicAccess_shouldReturnOrderedImages() {
        when(businessRepository.existsById(businessId)).thenReturn(true);
        BusinessImage imgCover = BusinessImage.builder()
                .id(UUID.randomUUID())
                .business(testBusiness)
                .imageUrl("https://cloud.com/cover.jpg")
                .isCover(true)
                .build();
        BusinessImage imgGallery = BusinessImage.builder()
                .id(UUID.randomUUID())
                .business(testBusiness)
                .imageUrl("https://cloud.com/gallery.jpg")
                .isCover(false)
                .build();

        when(businessImageRepository.findByBusinessIdOrderByIsCoverDescSortOrderAscCreatedAtDesc(businessId))
                .thenReturn(List.of(imgCover, imgGallery));

        List<BusinessImageResponse> result = businessImageService.getImagesForBusiness(businessId);

        assertEquals(2, result.size());
        assertTrue(result.get(0).isCover());
        assertFalse(result.get(1).isCover());
    }

    @Test
    void getImagesForBusiness_businessNotFound_shouldThrow404() {
        when(businessRepository.existsById(businessId)).thenReturn(false);

        assertThrows(BusinessNotFoundException.class,
                () -> businessImageService.getImagesForBusiness(businessId));
    }

    @Test
    void setCoverImage_asOwner_shouldUnsetExistingAndSetNewCover() {
        UUID imageId = UUID.randomUUID();
        when(userRepository.findByEmail("owner@business.com")).thenReturn(Optional.of(businessOwner));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));

        BusinessImage image = BusinessImage.builder()
                .id(imageId)
                .business(testBusiness)
                .imageUrl("https://cloud.com/newcover.jpg")
                .isCover(false)
                .build();

        when(businessImageRepository.findByIdAndBusinessId(imageId, businessId)).thenReturn(Optional.of(image));
        when(businessImageRepository.save(any(BusinessImage.class))).thenAnswer(i -> i.getArgument(0));

        BusinessImageResponse response = businessImageService.setCoverImage(businessId, imageId);

        assertTrue(response.isCover());
        verify(businessImageRepository).unsetCoverForBusiness(businessId);
        verify(businessImageRepository).save(image);
    }

    @Test
    void setCoverImage_imageNotBelongingToBusiness_shouldThrow404() {
        UUID imageId = UUID.randomUUID();
        when(userRepository.findByEmail("owner@business.com")).thenReturn(Optional.of(businessOwner));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(businessImageRepository.findByIdAndBusinessId(imageId, businessId)).thenReturn(Optional.empty());

        assertThrows(ImageNotFoundException.class,
                () -> businessImageService.setCoverImage(businessId, imageId));
    }

    @Test
    void deleteImage_asCoverPhoto_shouldDeleteAndPromoteRemainingImage() {
        UUID imageId = UUID.randomUUID();
        UUID remainingImageId = UUID.randomUUID();

        when(userRepository.findByEmail("owner@business.com")).thenReturn(Optional.of(businessOwner));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));

        BusinessImage coverToDelete = BusinessImage.builder()
                .id(imageId)
                .business(testBusiness)
                .storageId("kasicircle/cover-to-delete")
                .isCover(true)
                .build();

        BusinessImage remainingImage = BusinessImage.builder()
                .id(remainingImageId)
                .business(testBusiness)
                .storageId("kasicircle/remaining")
                .isCover(false)
                .build();

        when(businessImageRepository.findByIdAndBusinessId(imageId, businessId)).thenReturn(Optional.of(coverToDelete));
        when(businessImageRepository.findByBusinessIdOrderByCreatedAtAsc(businessId)).thenReturn(List.of(remainingImage));

        businessImageService.deleteImage(businessId, imageId);

        verify(imageStorageService).deleteImage("kasicircle/cover-to-delete");
        verify(businessImageRepository).delete(coverToDelete);
        assertTrue(remainingImage.getIsCover(), "Remaining image must be promoted to cover");
        verify(businessImageRepository).save(remainingImage);
    }

    @Test
    void deleteImage_imageNotBelongingToBusiness_shouldThrow404() {
        UUID imageId = UUID.randomUUID();
        when(userRepository.findByEmail("owner@business.com")).thenReturn(Optional.of(businessOwner));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(businessImageRepository.findByIdAndBusinessId(imageId, businessId)).thenReturn(Optional.empty());

        assertThrows(ImageNotFoundException.class,
                () -> businessImageService.deleteImage(businessId, imageId));
        verifyNoInteractions(imageStorageService);
    }
}

