package com.kasicircle.backend.businesses.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kasicircle.backend.businesses.dto.BusinessResponse;
import com.kasicircle.backend.businesses.dto.CreateBusinessRequest;
import com.kasicircle.backend.businesses.exception.BusinessNotFoundException;
import com.kasicircle.backend.businesses.service.BusinessService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser // Apply mock user to all tests in the class
class BusinessControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BusinessService businessService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createBusiness_withValidDataAndAuthenticatedUser_shouldReturnCreated() throws Exception {
        // ... (existing test code)
    }

    @Test
    void createBusiness_withInvalidData_shouldReturnBadRequest() throws Exception {
        // ... (existing test code)
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

        when(businessService.getAllBusinesses(any(PageRequest.class))).thenReturn(page);

        mockMvc.perform(get("/api/businesses?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(businessId.toString()))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void createBusiness_withUnauthenticatedUser_shouldReturnUnauthorized() throws Exception {
        // ... (existing test code)
    }
}