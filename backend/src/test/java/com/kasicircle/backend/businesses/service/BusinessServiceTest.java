package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.dto.BusinessResponse;
import com.kasicircle.backend.businesses.dto.UpdateBusinessRequest;
import com.kasicircle.backend.businesses.exception.BusinessNotFoundException;
import com.kasicircle.backend.businesses.mapper.BusinessMapper;
import com.kasicircle.backend.businesses.repository.BusinessRepository;
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
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
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

        testUser = User.builder().id(userId).email("test@example.com").build();
        testBusiness = Business.builder().id(businessId).name("Test Business").owner(testUser).build();
        testBusinessResponse = BusinessResponse.builder().id(businessId).name("Test Business").ownerId(userId).build();
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
        when(businessRepository.findAll(pageable)).thenReturn(businessPage);
        when(businessMapper.toBusinessResponse(any(Business.class))).thenReturn(testBusinessResponse);

        Page<BusinessResponse> result = businessService.getAllBusinesses(pageable);

        assertFalse(result.isEmpty());
        assertEquals(1, result.getTotalElements());
        assertEquals(businessId, result.getContent().get(0).id());
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

        assertEquals(request.name(), result.name());
        assertEquals(request.email(), result.email());
        assertEquals(userId, result.ownerId());
    }

    @Test
    void updateBusiness_nonOwner_shouldThrowForbidden() {
        User otherUser = User.builder().id(UUID.randomUUID()).email("other@example.com").build();
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
        User otherUser = User.builder().id(UUID.randomUUID()).email("other@example.com").build();
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
}
