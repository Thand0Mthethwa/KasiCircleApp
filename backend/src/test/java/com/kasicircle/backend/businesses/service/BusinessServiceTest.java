package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.dto.BusinessRatingStats;
import com.kasicircle.backend.businesses.dto.BusinessResponse;
import com.kasicircle.backend.businesses.dto.CreateBusinessRequest;
import com.kasicircle.backend.businesses.dto.UpdateBusinessRequest;
import com.kasicircle.backend.businesses.exception.BusinessAlreadyExistsException;
import com.kasicircle.backend.businesses.exception.BusinessNotFoundException;
import com.kasicircle.backend.businesses.mapper.BusinessMapper;
import com.kasicircle.backend.businesses.repository.BusinessRepository;
import com.kasicircle.backend.businesses.repository.BusinessReviewRepository;
import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.entity.Role;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BusinessServiceTest {

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BusinessMapper businessMapper;

    @Mock
    private BusinessReviewRepository businessReviewRepository;

    @InjectMocks
    private BusinessServiceImpl businessService;

    private User testUser;
    private Business testBusiness;
    private BusinessResponse testBusinessResponse;
    private UUID businessId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        businessId = UUID.randomUUID();

        testUser = User.builder().id(userId).email("test@example.com").accountType(AccountType.BUSINESS).build();
        testBusiness = Business.builder().id(businessId).name("Test Business").owner(testUser).build();
        testBusinessResponse = BusinessResponse.builder().id(businessId).name("Test Business").ownerId(userId).build();
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getBusinessById_whenBusinessExists_shouldReturnBusinessResponse() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(businessMapper.toBusinessResponse(testBusiness)).thenReturn(testBusinessResponse);

        BusinessResponse result = businessService.getBusinessById(businessId);

        assertNotNull(result);
        assertEquals(businessId, result.id());
    }

    @Test
    void getBusinessById_whenBusinessDoesNotExist_shouldThrowBusinessNotFoundException() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.empty());

        assertThrows(BusinessNotFoundException.class, () -> businessService.getBusinessById(businessId));
    }

    @Test
    void getAllBusinesses_shouldReturnPageOfBusinessResponses() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Business> businessPage = new PageImpl<>(Collections.singletonList(testBusiness));
        when(businessRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(businessPage);
        when(businessMapper.toBusinessResponse(any(Business.class))).thenReturn(testBusinessResponse);

        Page<BusinessResponse> result = businessService.getAllBusinesses(pageable);

        assertFalse(result.isEmpty());
        assertEquals(1, result.getTotalElements());
        assertEquals(businessId, result.getContent().get(0).id());
    }

    @Test
    void getAllBusinesses_withFilters_shouldReturnFilteredPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Business> businessPage = new PageImpl<>(Collections.singletonList(testBusiness));
        when(businessRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(businessPage);
        when(businessMapper.toBusinessResponse(any(Business.class))).thenReturn(testBusinessResponse);

        Page<BusinessResponse> result = businessService.getAllBusinesses("Cafe", "Food & Beverage", "Soweto", pageable);

        assertFalse(result.isEmpty());
        assertEquals(1, result.getTotalElements());
        assertEquals(businessId, result.getContent().get(0).id());
        verify(businessRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void getBusinessesForCurrentUser_shouldReturnPageOfOwnedBusinesses() {
        // Mock SecurityContext
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(testUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        Pageable pageable = PageRequest.of(0, 10);
        Page<Business> businessPage = new PageImpl<>(Collections.singletonList(testBusiness));
        when(businessRepository.findByOwner(testUser, pageable)).thenReturn(businessPage);
        when(businessMapper.toBusinessResponse(any(Business.class))).thenReturn(testBusinessResponse);

        Page<BusinessResponse> result = businessService.getBusinessesForCurrentUser(pageable);

        assertFalse(result.isEmpty());
        assertEquals(1, result.getTotalElements());
        assertEquals(userId, result.getContent().get(0).ownerId());
    }

    @Test
    void updateBusiness_asOwner_shouldReturnUpdatedResponse() {
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(testUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));

        UpdateBusinessRequest request = UpdateBusinessRequest.builder()
                .name("Updated Name")
                .description("Updated description")
                .phoneNumber("+27123456789")
                .email("updated@example.com")
                .category("Retail")
                .address("123 Updated Street")
                .city("Cape Town")
                .province("Western Cape")
                .build();

        Business updatedBusiness = Business.builder()
                .id(businessId)
                .name(request.name())
                .description(request.description())
                .phoneNumber(request.phoneNumber())
                .email(request.email())
                .category(request.category())
                .address(request.address())
                .city(request.city())
                .province(request.province())
                .owner(testUser)
                .build();

        when(businessRepository.save(any(Business.class))).thenReturn(updatedBusiness);
        when(businessMapper.toBusinessResponse(updatedBusiness)).thenReturn(BusinessResponse.builder()
                .id(businessId)
                .name(request.name())
                .description(request.description())
                .phoneNumber(request.phoneNumber())
                .email(request.email())
                .category(request.category())
                .address(request.address())
                .city(request.city())
                .province(request.province())
                .ownerId(userId)
                .build());

        BusinessResponse result = businessService.updateBusiness(businessId, request);

        verify(businessRepository).save(testBusiness);
        assertEquals(request.name(), testBusiness.getName());
        assertEquals(request.description(), testBusiness.getDescription());
        assertEquals(request.phoneNumber(), testBusiness.getPhoneNumber());
        assertEquals(request.email(), testBusiness.getEmail());
        assertEquals(request.category(), testBusiness.getCategory());
        assertEquals(request.address(), testBusiness.getAddress());
        assertEquals(request.city(), testBusiness.getCity());
        assertEquals(request.province(), testBusiness.getProvince());

        assertEquals(request.name(), result.name());
        assertEquals(request.email(), result.email());
        assertEquals(userId, result.ownerId());
    }

    @Test
    void updateBusiness_nonOwner_shouldThrowForbidden() {
        User otherUser = User.builder().id(UUID.randomUUID()).email("other@example.com").accountType(AccountType.BUSINESS).build();
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(otherUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(otherUser.getEmail())).thenReturn(Optional.of(otherUser));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));

        UpdateBusinessRequest request = UpdateBusinessRequest.builder()
                .name("Updated Name")
                .description("Updated description")
                .phoneNumber("+27123456789")
                .email("updated@example.com")
                .category("Retail")
                .address("123 Updated Street")
                .city("Cape Town")
                .province("Western Cape")
                .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> businessService.updateBusiness(businessId, request));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void updateBusiness_whenBusinessNotFound_shouldThrowBusinessNotFoundException() {
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(testUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(businessRepository.findById(businessId)).thenReturn(Optional.empty());

        UpdateBusinessRequest request = UpdateBusinessRequest.builder()
                .name("Updated Name")
                .description("Updated description")
                .phoneNumber("+27123456789")
                .email("updated@example.com")
                .category("Retail")
                .address("123 Updated Street")
                .city("Cape Town")
                .province("Western Cape")
                .build();

        assertThrows(BusinessNotFoundException.class, () -> businessService.updateBusiness(businessId, request));
    }

    @Test
    void deleteBusiness_asOwner_shouldDeleteBusiness() {
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(testUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));

        businessService.deleteBusiness(businessId);

        verify(businessRepository).delete(testBusiness);
    }

    @Test
    void deleteBusiness_nonOwner_shouldThrowForbidden() {
        User otherUser = User.builder().id(UUID.randomUUID()).email("other@example.com").accountType(AccountType.BUSINESS).build();
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(otherUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(otherUser.getEmail())).thenReturn(Optional.of(otherUser));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> businessService.deleteBusiness(businessId));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void createBusiness_asBusinessAccount_shouldSucceed() {
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(testUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(businessRepository.save(any(Business.class))).thenReturn(testBusiness);
        when(businessMapper.toBusinessResponse(testBusiness)).thenReturn(testBusinessResponse);

        CreateBusinessRequest request = CreateBusinessRequest.builder()
                .name("New Business")
                .description("Description")
                .phoneNumber("+27123456789")
                .email("biz@example.com")
                .category("Services")
                .address("123 Street")
                .city("Johannesburg")
                .province("Gauteng")
                .build();

        BusinessResponse response = businessService.createBusiness(request);

        assertNotNull(response);
        assertEquals(businessId, response.id());
    }

    @Test
    void createBusiness_whenOwnerAlreadyHasBusiness_shouldThrowConflict() {
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(testUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(businessRepository.existsByOwner(testUser)).thenReturn(true);

        CreateBusinessRequest request = CreateBusinessRequest.builder()
                .name("Second Business")
                .description("Description")
                .phoneNumber("+27123456789")
                .email("second@example.com")
                .category("Services")
                .address("123 Street")
                .city("Johannesburg")
                .province("Gauteng")
                .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> businessService.createBusiness(request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertTrue(exception.getReason().contains("already exists"));
    }

    @Test
    void createBusiness_asResidentAccount_shouldThrowForbidden() {
        User residentUser = User.builder().id(UUID.randomUUID()).email("resident@example.com").accountType(AccountType.RESIDENT).build();
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(residentUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(residentUser.getEmail())).thenReturn(Optional.of(residentUser));

        CreateBusinessRequest request = CreateBusinessRequest.builder()
                .name("New Business")
                .description("Description")
                .phoneNumber("+27123456789")
                .email("biz@example.com")
                .category("Services")
                .address("123 Street")
                .city("Johannesburg")
                .province("Gauteng")
                .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> businessService.createBusiness(request));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Only BUSINESS accounts"));
    }

    @Test
    void createBusiness_asWorkerAccount_shouldThrowForbidden() {
        User workerUser = User.builder().id(UUID.randomUUID()).email("worker@example.com").accountType(AccountType.WORKER).build();
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(workerUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(workerUser.getEmail())).thenReturn(Optional.of(workerUser));

        CreateBusinessRequest request = CreateBusinessRequest.builder()
                .name("New Business")
                .description("Description")
                .phoneNumber("+27123456789")
                .email("biz@example.com")
                .category("Services")
                .address("123 Street")
                .city("Johannesburg")
                .province("Gauteng")
                .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> businessService.createBusiness(request));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void createBusiness_asAdminWithResidentAccount_shouldThrowForbidden() {
        User adminResident = User.builder()
                .id(UUID.randomUUID())
                .email("admin@example.com")
                .role(Role.ADMIN)
                .accountType(AccountType.RESIDENT)
                .build();
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(adminResident.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(adminResident.getEmail())).thenReturn(Optional.of(adminResident));

        CreateBusinessRequest request = CreateBusinessRequest.builder()
                .name("Admin Business")
                .description("Description")
                .phoneNumber("+27123456789")
                .email("adminbiz@example.com")
                .category("Services")
                .address("123 Street")
                .city("Johannesburg")
                .province("Gauteng")
                .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> businessService.createBusiness(request));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void updateBusiness_asResidentAccount_shouldThrowForbidden() {
        User residentOwner = User.builder().id(userId).email("resident@example.com").accountType(AccountType.RESIDENT).build();
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(residentOwner.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(residentOwner.getEmail())).thenReturn(Optional.of(residentOwner));

        UpdateBusinessRequest request = UpdateBusinessRequest.builder()
                .name("Updated Name")
                .description("Updated description")
                .phoneNumber("+27123456789")
                .email("updated@example.com")
                .category("Retail")
                .address("123 Street")
                .city("Cape Town")
                .province("Western Cape")
                .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> businessService.updateBusiness(businessId, request));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void updateBusiness_asWorkerAccount_shouldThrowForbidden() {
        User workerOwner = User.builder().id(userId).email("worker@example.com").accountType(AccountType.WORKER).build();
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(workerOwner.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(workerOwner.getEmail())).thenReturn(Optional.of(workerOwner));

        UpdateBusinessRequest request = UpdateBusinessRequest.builder()
                .name("Updated Name")
                .description("Updated description")
                .phoneNumber("+27123456789")
                .email("updated@example.com")
                .category("Retail")
                .address("123 Street")
                .city("Cape Town")
                .province("Western Cape")
                .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> businessService.updateBusiness(businessId, request));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void updateBusiness_asOtherBusinessAccount_shouldThrowForbidden() {
        User otherBizUser = User.builder().id(UUID.randomUUID()).email("otherbiz@example.com").accountType(AccountType.BUSINESS).build();
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(otherBizUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(otherBizUser.getEmail())).thenReturn(Optional.of(otherBizUser));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));

        UpdateBusinessRequest request = UpdateBusinessRequest.builder()
                .name("Updated Name")
                .description("Updated description")
                .phoneNumber("+27123456789")
                .email("updated@example.com")
                .category("Retail")
                .address("123 Street")
                .city("Cape Town")
                .province("Western Cape")
                .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> businessService.updateBusiness(businessId, request));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        assertTrue(exception.getReason().contains("not authorized to modify this business"));
    }

    @Test
    void deleteBusiness_asResidentAccount_shouldThrowForbidden() {
        User residentOwner = User.builder().id(userId).email("resident@example.com").accountType(AccountType.RESIDENT).build();
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(residentOwner.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(residentOwner.getEmail())).thenReturn(Optional.of(residentOwner));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> businessService.deleteBusiness(businessId));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void deleteBusiness_asWorkerAccount_shouldThrowForbidden() {
        User workerOwner = User.builder().id(userId).email("worker@example.com").accountType(AccountType.WORKER).build();
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(workerOwner.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(workerOwner.getEmail())).thenReturn(Optional.of(workerOwner));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> businessService.deleteBusiness(businessId));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void deleteBusiness_asOtherBusinessAccount_shouldThrowForbidden() {
        User otherBizUser = User.builder().id(UUID.randomUUID()).email("otherbiz@example.com").accountType(AccountType.BUSINESS).build();
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(otherBizUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(otherBizUser.getEmail())).thenReturn(Optional.of(otherBizUser));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> businessService.deleteBusiness(businessId));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        assertTrue(exception.getReason().contains("not authorized to modify this business"));
    }

    @Test
    void deleteBusiness_whenBusinessNotFound_shouldThrowBusinessNotFoundException() {
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(testUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(businessRepository.findById(businessId)).thenReturn(Optional.empty());

        assertThrows(BusinessNotFoundException.class, () -> businessService.deleteBusiness(businessId));
    }

    @Test
    void getBusinessById_whenNoReviews_shouldReturnDefaultRatings() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(businessMapper.toBusinessResponse(testBusiness)).thenReturn(testBusinessResponse);
        when(businessReviewRepository.findRatingStatsByBusinessIds(anyCollection())).thenReturn(Collections.emptyList());

        BusinessResponse result = businessService.getBusinessById(businessId);

        assertNotNull(result);
        assertEquals(0.0, result.averageRating());
        assertEquals(0L, result.reviewCount());
    }

    @Test
    void getBusinessById_whenHasReviews_shouldReturnCalculatedRatingsAndRoundToOneDecimalPlace() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(businessMapper.toBusinessResponse(testBusiness)).thenReturn(testBusinessResponse);

        // Average 4.66666... with 3 reviews -> rounded to 4.7
        BusinessRatingStats stats = new BusinessRatingStats(businessId, 4.666667, 3L);
        when(businessReviewRepository.findRatingStatsByBusinessIds(anyCollection()))
                .thenReturn(Collections.singletonList(stats));

        BusinessResponse result = businessService.getBusinessById(businessId);

        assertNotNull(result);
        assertEquals(4.7, result.averageRating());
        assertEquals(3L, result.reviewCount());
    }

    @Test
    void getAllBusinesses_batchRatingRetrieval_avoidsNPlusOneAndMapsCorrectly() {
        UUID b1Id = UUID.randomUUID();
        UUID b2Id = UUID.randomUUID();
        UUID b3Id = UUID.randomUUID();

        Business b1 = Business.builder().id(b1Id).name("Biz 1").build();
        Business b2 = Business.builder().id(b2Id).name("Biz 2").build();
        Business b3 = Business.builder().id(b3Id).name("Biz 3").build();

        BusinessResponse r1 = BusinessResponse.builder().id(b1Id).name("Biz 1").build();
        BusinessResponse r2 = BusinessResponse.builder().id(b2Id).name("Biz 2").build();
        BusinessResponse r3 = BusinessResponse.builder().id(b3Id).name("Biz 3").build();

        Pageable pageable = PageRequest.of(0, 10);
        Page<Business> businessPage = new PageImpl<>(List.of(b1, b2, b3), pageable, 3);

        when(businessRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(businessPage);
        when(businessMapper.toBusinessResponse(b1)).thenReturn(r1);
        when(businessMapper.toBusinessResponse(b2)).thenReturn(r2);
        when(businessMapper.toBusinessResponse(b3)).thenReturn(r3);

        // b1 has 4.3333... -> 4.3 (6 reviews); b3 has 5.0 (2 reviews); b2 has no reviews (not in DB result)
        BusinessRatingStats s1 = new BusinessRatingStats(b1Id, 4.333333, 6L);
        BusinessRatingStats s3 = new BusinessRatingStats(b3Id, 5.0, 2L);
        when(businessReviewRepository.findRatingStatsByBusinessIds(anyCollection()))
                .thenReturn(List.of(s1, s3));

        Page<BusinessResponse> result = businessService.getAllBusinesses(pageable);

        assertNotNull(result);
        assertEquals(3, result.getTotalElements());

        // CRITICAL: Ensure batch query was called exactly ONCE, proving NO N+1 query
        verify(businessReviewRepository, times(1)).findRatingStatsByBusinessIds(anyCollection());

        BusinessResponse res1 = result.getContent().get(0);
        assertEquals(b1Id, res1.id());
        assertEquals(4.3, res1.averageRating());
        assertEquals(6L, res1.reviewCount());

        BusinessResponse res2 = result.getContent().get(1);
        assertEquals(b2Id, res2.id());
        assertEquals(0.0, res2.averageRating());
        assertEquals(0L, res2.reviewCount());

        BusinessResponse res3 = result.getContent().get(2);
        assertEquals(b3Id, res3.id());
        assertEquals(5.0, res3.averageRating());
        assertEquals(2L, res3.reviewCount());
    }

    @Test
    void getAllBusinesses_whenPageIsEmpty_shouldNotQueryRatings() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Business> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

        when(businessRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(emptyPage);

        Page<BusinessResponse> result = businessService.getAllBusinesses(pageable);

        assertNotNull(result);
        assertTrue(result.isEmpty());

        // Verified: avoid unnecessary aggregate query when result page is empty
        verify(businessReviewRepository, never()).findRatingStatsByBusinessIds(any());
    }

    @Test
    void getBusinessesForCurrentUser_batchRatingRetrieval_mapsRatingsCorrectly() {
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(testUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        Pageable pageable = PageRequest.of(0, 10);
        Page<Business> page = new PageImpl<>(Collections.singletonList(testBusiness), pageable, 1);
        when(businessRepository.findByOwner(testUser, pageable)).thenReturn(page);
        when(businessMapper.toBusinessResponse(testBusiness)).thenReturn(testBusinessResponse);

        BusinessRatingStats stats = new BusinessRatingStats(businessId, 4.0, 5L);
        when(businessReviewRepository.findRatingStatsByBusinessIds(anyCollection()))
                .thenReturn(Collections.singletonList(stats));

        Page<BusinessResponse> result = businessService.getBusinessesForCurrentUser(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(4.0, result.getContent().get(0).averageRating());
        assertEquals(5L, result.getContent().get(0).reviewCount());
        verify(businessReviewRepository, times(1)).findRatingStatsByBusinessIds(anyCollection());
    }

    @Test
    void updateBusiness_preservesExistingRatings() {
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(testUser.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(businessRepository.save(any(Business.class))).thenReturn(testBusiness);
        when(businessMapper.toBusinessResponse(testBusiness)).thenReturn(testBusinessResponse);

        BusinessRatingStats stats = new BusinessRatingStats(businessId, 4.8, 12L);
        when(businessReviewRepository.findRatingStatsByBusinessIds(anyCollection()))
                .thenReturn(Collections.singletonList(stats));

        UpdateBusinessRequest request = UpdateBusinessRequest.builder()
                .name("Updated Business")
                .description("Updated description")
                .phoneNumber("+27123456789")
                .email("updated@business.com")
                .category("Services")
                .address("456 Other Street")
                .city("Johannesburg")
                .province("Gauteng")
                .build();

        BusinessResponse result = businessService.updateBusiness(businessId, request);

        assertNotNull(result);
        assertEquals(4.8, result.averageRating());
        assertEquals(12L, result.reviewCount());
    }
}
