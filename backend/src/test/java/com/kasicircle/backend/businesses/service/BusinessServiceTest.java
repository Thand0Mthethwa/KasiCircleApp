package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.dto.BusinessResponse;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
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
}
