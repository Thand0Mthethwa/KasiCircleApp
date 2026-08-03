package com.kasicircle.backend.businesses.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kasicircle.backend.businesses.dto.BusinessResponse;
import com.kasicircle.backend.businesses.dto.CreateBusinessRequest;
import com.kasicircle.backend.businesses.service.BusinessService;
import com.kasicircle.backend.users.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class BusinessControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BusinessService businessService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "test@example.com")
    void createBusiness_withValidDataAndAuthenticatedUser_shouldReturnCreated() throws Exception {
        CreateBusinessRequest request = new CreateBusinessRequest(
                "Test Business",
                "A description of the test business.",
                "+27123456789",
                "business@example.com",
                "Retail",
                "123 Test Street",
                "Testville",
                "Gauteng"
        );

        BusinessResponse response = new BusinessResponse(
                UUID.randomUUID(),
                "Test Business",
                "A description of the test business.",
                "+27123456789",
                "business@example.com",
                "Retail",
                "123 Test Street",
                "Testville",
                "Gauteng",
                UUID.randomUUID(),
                Instant.now(),
                Instant.now()
        );

        when(businessService.createBusiness(any(CreateBusinessRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/businesses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Test Business"))
                .andExpect(jsonPath("$.email").value("business@example.com"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void createBusiness_withInvalidData_shouldReturnBadRequest() throws Exception {
        CreateBusinessRequest request = new CreateBusinessRequest(
                "", // Blank name
                "A description of the test business.",
                "+27123456789",
                "business@example.com",
                "Retail",
                "123 Test Street",
                "Testville",
                "Gauteng"
        );

        mockMvc.perform(post("/api/businesses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createBusiness_withUnauthenticatedUser_shouldReturnUnauthorized() throws Exception {
        CreateBusinessRequest request = new CreateBusinessRequest(
                "Test Business",
                "A description of the test business.",
                "+27123456789",
                "business@example.com",
                "Retail",
                "123 Test Street",
                "Testville",
                "Gauteng"
        );

        mockMvc.perform(post("/api/businesses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}