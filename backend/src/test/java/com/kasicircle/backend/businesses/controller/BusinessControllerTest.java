package com.kasicircle.backend.businesses.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kasicircle.backend.businesses.dto.BusinessResponse;
import com.kasicircle.backend.businesses.dto.CreateBusinessRequest;
import com.kasicircle.backend.businesses.dto.UpdateBusinessRequest;
import com.kasicircle.backend.businesses.exception.BusinessAlreadyExistsException;
import com.kasicircle.backend.businesses.exception.BusinessNotFoundException;
import com.kasicircle.backend.businesses.service.BusinessService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BusinessControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BusinessService businessService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "test@example.com")
    void createBusiness_withValidDataAndAuthenticatedUser_shouldReturnCreated() throws Exception {
        CreateBusinessRequest request = CreateBusinessRequest.builder()
                .name("Test Business")
                .description("Test description")
                .phoneNumber("+27123456789")
                .email("test@business.com")
                .category("Retail")
                .address("123 Main Street")
                .city("Johannesburg")
                .province("Gauteng")
                .build();

        UUID businessId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        BusinessResponse response = BusinessResponse.builder()
                .id(businessId)
                .name(request.name())
                .description(request.description())
                .phoneNumber(request.phoneNumber())
                .email(request.email())
                .category(request.category())
                .address(request.address())
                .city(request.city())
                .province(request.province())
                .ownerId(ownerId)
                .build();

        when(businessService.createBusiness(any(CreateBusinessRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/businesses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(businessId.toString()))
                .andExpect(jsonPath("$.name").value("Test Business"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void createBusiness_withInvalidData_shouldReturnBadRequest() throws Exception {
        CreateBusinessRequest invalidRequest = CreateBusinessRequest.builder()
                .name("")
                .description("Description")
                .phoneNumber("+27123456789")
                .email("invalid-email")
                .category("Retail")
                .address("123 Main Street")
                .city("Johannesburg")
                .province("Gauteng")
                .build();

        mockMvc.perform(post("/api/businesses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithAnonymousUser
    void createBusiness_withUnauthenticatedUser_shouldReturnUnauthorized() throws Exception {
        CreateBusinessRequest request = CreateBusinessRequest.builder()
                .name("Test Business")
                .description("Test description")
                .phoneNumber("+27123456789")
                .email("test@business.com")
                .category("Retail")
                .address("123 Main Street")
                .city("Johannesburg")
                .province("Gauteng")
                .build();

        mockMvc.perform(post("/api/businesses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "resident@example.com")
    void createBusiness_whenNotBusinessAccount_shouldReturnForbidden() throws Exception {
        CreateBusinessRequest request = CreateBusinessRequest.builder()
                .name("Test Business")
                .description("Test description")
                .phoneNumber("+27123456789")
                .email("test@business.com")
                .category("Retail")
                .address("123 Main Street")
                .city("Johannesburg")
                .province("Gauteng")
                .build();

        when(businessService.createBusiness(any(CreateBusinessRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Only BUSINESS accounts can create, update, or delete businesses."));

        mockMvc.perform(post("/api/businesses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "business@example.com")
    void createBusiness_whenOwnerAlreadyHasBusiness_shouldReturnConflict() throws Exception {
        CreateBusinessRequest request = CreateBusinessRequest.builder()
                .name("Second Business")
                .description("Second business description")
                .phoneNumber("+27123456789")
                .email("second@business.com")
                .category("Retail")
                .address("123 Main Street")
                .city("Johannesburg")
                .province("Gauteng")
                .build();

        when(businessService.createBusiness(any(CreateBusinessRequest.class)))
                .thenThrow(new BusinessAlreadyExistsException("A business listing already exists for this account."));

        mockMvc.perform(post("/api/businesses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("A business listing already exists for this account."));
    }

    @Test
    @WithAnonymousUser
    void getBusinessById_asAnonymousUser_whenExists_shouldReturnOk() throws Exception {
        UUID businessId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        BusinessResponse response = BusinessResponse.builder()
                .id(businessId)
                .name("Public Business")
                .description("Quality township enterprise services")
                .phoneNumber("+27821112222")
                .email("contact@publicbiz.co.za")
                .category("Retail")
                .address("10 Vilakazi St")
                .city("Soweto")
                .province("Gauteng")
                .ownerId(ownerId)
                .build();

        when(businessService.getBusinessById(businessId)).thenReturn(response);

        mockMvc.perform(get("/api/businesses/{id}", businessId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(businessId.toString()))
                .andExpect(jsonPath("$.name").value("Public Business"))
                .andExpect(jsonPath("$.description").value("Quality township enterprise services"))
                .andExpect(jsonPath("$.phoneNumber").value("+27821112222"))
                .andExpect(jsonPath("$.email").value("contact@publicbiz.co.za"))
                .andExpect(jsonPath("$.category").value("Retail"))
                .andExpect(jsonPath("$.address").value("10 Vilakazi St"))
                .andExpect(jsonPath("$.city").value("Soweto"))
                .andExpect(jsonPath("$.province").value("Gauteng"))
                .andExpect(jsonPath("$.ownerId").value(ownerId.toString()))
                .andExpect(jsonPath("$.averageRating").value(0.0))
                .andExpect(jsonPath("$.reviewCount").value(0));
    }

    @Test
    @WithAnonymousUser
    void getBusinessById_withRatings_shouldReturnRatingAndReviewCount() throws Exception {
        UUID businessId = UUID.randomUUID();
        BusinessResponse response = BusinessResponse.builder()
                .id(businessId)
                .name("Rated Business")
                .averageRating(4.5)
                .reviewCount(18L)
                .build();

        when(businessService.getBusinessById(businessId)).thenReturn(response);

        mockMvc.perform(get("/api/businesses/{id}", businessId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(businessId.toString()))
                .andExpect(jsonPath("$.averageRating").value(4.5))
                .andExpect(jsonPath("$.reviewCount").value(18));
    }

    @Test
    @WithAnonymousUser
    void getAllBusinesses_withRatings_shouldIncludeRatingsInListResponse() throws Exception {
        UUID businessId = UUID.randomUUID();
        BusinessResponse response = BusinessResponse.builder()
                .id(businessId)
                .name("Top Cafe")
                .averageRating(4.8)
                .reviewCount(25L)
                .build();
        Page<BusinessResponse> page = new PageImpl<>(Collections.singletonList(response));

        when(businessService.getAllBusinesses(any(), any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/businesses?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(businessId.toString()))
                .andExpect(jsonPath("$.content[0].averageRating").value(4.8))
                .andExpect(jsonPath("$.content[0].reviewCount").value(25));
    }

    @Test
    @WithAnonymousUser
    void getBusinessById_asAnonymousUser_whenNotExists_shouldReturnNotFound() throws Exception {
        UUID businessId = UUID.randomUUID();
        when(businessService.getBusinessById(businessId)).thenThrow(new BusinessNotFoundException("Not found"));

        mockMvc.perform(get("/api/businesses/{id}", businessId))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithAnonymousUser
    void getAllBusinesses_asAnonymousUser_shouldReturnOk() throws Exception {
        UUID businessId = UUID.randomUUID();
        BusinessResponse response = BusinessResponse.builder().id(businessId).name("Public Business").build();
        Page<BusinessResponse> page = new PageImpl<>(Collections.singletonList(response));

        when(businessService.getAllBusinesses(any(), any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/businesses?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(businessId.toString()))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @WithAnonymousUser
    void getAllBusinesses_withSearchAndFilters_shouldReturnFilteredResults() throws Exception {
        UUID businessId = UUID.randomUUID();
        BusinessResponse response = BusinessResponse.builder()
                .id(businessId)
                .name("Soweto Cafe")
                .category("Food & Beverage")
                .city("Soweto")
                .build();
        Page<BusinessResponse> page = new PageImpl<>(Collections.singletonList(response));

        when(businessService.getAllBusinesses(eq("Cafe"), eq("Food & Beverage"), eq("Soweto"), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/businesses")
                        .param("search", "Cafe")
                        .param("category", "Food & Beverage")
                        .param("city", "Soweto")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Soweto Cafe"))
                .andExpect(jsonPath("$.content[0].category").value("Food & Beverage"))
                .andExpect(jsonPath("$.content[0].city").value("Soweto"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void getBusinessById_whenExists_shouldReturnOk() throws Exception {
        UUID businessId = UUID.randomUUID();
        BusinessResponse response = BusinessResponse.builder()
                .id(businessId)
                .name("Test Business")
                .build();

        when(businessService.getBusinessById(businessId)).thenReturn(response);

        mockMvc.perform(get("/api/businesses/{id}", businessId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(businessId.toString()))
                .andExpect(jsonPath("$.name").value("Test Business"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void getBusinessById_whenNotExists_shouldReturnNotFound() throws Exception {
        UUID businessId = UUID.randomUUID();
        when(businessService.getBusinessById(businessId)).thenThrow(new BusinessNotFoundException("Not found"));

        mockMvc.perform(get("/api/businesses/{id}", businessId))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void getAllBusinesses_shouldReturnOk() throws Exception {
        UUID businessId = UUID.randomUUID();
        BusinessResponse response = BusinessResponse.builder().id(businessId).build();
        Page<BusinessResponse> page = new PageImpl<>(Collections.singletonList(response));

        when(businessService.getAllBusinesses(any(), any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/businesses?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(businessId.toString()))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void updateBusiness_asOwner_shouldReturnOk() throws Exception {
        UUID businessId = UUID.randomUUID();
        UpdateBusinessRequest request = UpdateBusinessRequest.builder()
                .name("Updated Business")
                .description("Updated description")
                .phoneNumber("+27123456789")
                .email("updated@example.com")
                .category("Retail")
                .address("456 Updated Street")
                .city("Cape Town")
                .province("Western Cape")
                .build();

        BusinessResponse response = BusinessResponse.builder()
                .id(businessId)
                .name(request.name())
                .description(request.description())
                .phoneNumber(request.phoneNumber())
                .email(request.email())
                .category(request.category())
                .address(request.address())
                .city(request.city())
                .province(request.province())
                .build();

        when(businessService.updateBusiness(businessId, request)).thenReturn(response);

        mockMvc.perform(put("/api/businesses/{id}", businessId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(businessId.toString()))
                .andExpect(jsonPath("$.name").value("Updated Business"))
                .andExpect(jsonPath("$.description").value("Updated description"))
                .andExpect(jsonPath("$.phoneNumber").value("+27123456789"))
                .andExpect(jsonPath("$.email").value("updated@example.com"))
                .andExpect(jsonPath("$.category").value("Retail"))
                .andExpect(jsonPath("$.address").value("456 Updated Street"))
                .andExpect(jsonPath("$.city").value("Cape Town"))
                .andExpect(jsonPath("$.province").value("Western Cape"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void updateBusiness_withInvalidRequest_shouldReturnBadRequest() throws Exception {
        UUID businessId = UUID.randomUUID();

        mockMvc.perform(put("/api/businesses/{id}", businessId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void updateBusiness_whenNotOwner_shouldReturnForbidden() throws Exception {
        UUID businessId = UUID.randomUUID();
        UpdateBusinessRequest request = UpdateBusinessRequest.builder()
                .name("Updated Business")
                .description("Updated description")
                .phoneNumber("+27123456789")
                .email("updated@example.com")
                .category("Retail")
                .address("456 Updated Street")
                .city("Cape Town")
                .province("Western Cape")
                .build();

        when(businessService.updateBusiness(businessId, request))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN));

        mockMvc.perform(put("/api/businesses/{id}", businessId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "resident@example.com")
    void updateBusiness_whenNotBusinessAccount_shouldReturnForbidden() throws Exception {
        UUID businessId = UUID.randomUUID();
        UpdateBusinessRequest request = UpdateBusinessRequest.builder()
                .name("Updated Business")
                .description("Updated description")
                .phoneNumber("+27123456789")
                .email("updated@example.com")
                .category("Retail")
                .address("456 Updated Street")
                .city("Cape Town")
                .province("Western Cape")
                .build();

        when(businessService.updateBusiness(businessId, request))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Only BUSINESS accounts can create, update, or delete businesses."));

        mockMvc.perform(put("/api/businesses/{id}", businessId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithAnonymousUser
    void updateBusiness_withUnauthenticatedUser_shouldReturnUnauthorized() throws Exception {
        UUID businessId = UUID.randomUUID();
        UpdateBusinessRequest request = UpdateBusinessRequest.builder()
                .name("Updated Business")
                .description("Updated description")
                .phoneNumber("+27123456789")
                .email("updated@example.com")
                .category("Retail")
                .address("456 Updated Street")
                .city("Cape Town")
                .province("Western Cape")
                .build();

        mockMvc.perform(put("/api/businesses/{id}", businessId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void deleteBusiness_asOwner_shouldReturnNoContent() throws Exception {
        UUID businessId = UUID.randomUUID();
        doNothing().when(businessService).deleteBusiness(businessId);

        mockMvc.perform(delete("/api/businesses/{id}", businessId))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void deleteBusiness_whenNotOwner_shouldReturnForbidden() throws Exception {
        UUID businessId = UUID.randomUUID();
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN))
                .when(businessService).deleteBusiness(businessId);

        mockMvc.perform(delete("/api/businesses/{id}", businessId))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "resident@example.com")
    void deleteBusiness_whenNotBusinessAccount_shouldReturnForbidden() throws Exception {
        UUID businessId = UUID.randomUUID();
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Only BUSINESS accounts can create, update, or delete businesses."))
                .when(businessService).deleteBusiness(businessId);

        mockMvc.perform(delete("/api/businesses/{id}", businessId))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithAnonymousUser
    void deleteBusiness_withUnauthenticatedUser_shouldReturnUnauthorized() throws Exception {
        UUID businessId = UUID.randomUUID();

        mockMvc.perform(delete("/api/businesses/{id}", businessId))
                .andExpect(status().isUnauthorized());
    }
}
