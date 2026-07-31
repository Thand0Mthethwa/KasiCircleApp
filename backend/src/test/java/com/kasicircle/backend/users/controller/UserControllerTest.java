package com.kasicircle.backend.users.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kasicircle.backend.auth.jwt.JwtService;
import com.kasicircle.backend.users.dto.ChangePasswordRequest;
import com.kasicircle.backend.users.dto.UpdateUserProfileRequest;
import com.kasicircle.backend.users.dto.UserProfileResponse;
import com.kasicircle.backend.users.entity.Role;
import com.kasicircle.backend.users.exception.UserNotFoundException;
import com.kasicircle.backend.users.service.CustomUserDetailsService;
import com.kasicircle.backend.users.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "test@example.com")
    void getCurrentUser_withValidJwt_shouldReturnOk() throws Exception {
        UserProfileResponse userProfileResponse = UserProfileResponse.builder()
                .id(UUID.randomUUID())
                .firstName("Test")
                .lastName("User")
                .email("test@example.com")
                .phoneNumber("1234567890")
                .role(Role.USER)
                .build();

        when(userService.getCurrentUser()).thenReturn(userProfileResponse);

        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    void getCurrentUser_withMissingJwt_shouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void getCurrentUser_withDeletedUser_shouldReturnNotFound() throws Exception {
        when(userService.getCurrentUser()).thenThrow(new UserNotFoundException("User not found"));

        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void updateCurrentUser_withValidRequest_shouldReturnOk() throws Exception {
        UpdateUserProfileRequest updateRequest = UpdateUserProfileRequest.builder()
                .firstName("Updated")
                .lastName("User")
                .phoneNumber("+19876543210")
                .build();

        UserProfileResponse updatedProfile = UserProfileResponse.builder()
                .id(UUID.randomUUID())
                .firstName("Updated")
                .lastName("User")
                .email("test@example.com")
                .phoneNumber("+19876543210")
                .role(Role.USER)
                .build();

        when(userService.updateCurrentUser(any(UpdateUserProfileRequest.class))).thenReturn(updatedProfile);

        mockMvc.perform(put("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Updated"))
                .andExpect(jsonPath("$.phoneNumber").value("+19876543210"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void updateCurrentUser_withInvalidRequest_shouldReturnBadRequest() throws Exception {
        // Blank first name should trigger validation error
        UpdateUserProfileRequest invalidRequest = UpdateUserProfileRequest.builder()
                .firstName("")
                .lastName("User")
                .phoneNumber("1234567890")
                .build();

        mockMvc.perform(put("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.firstName").exists()); // Assert that firstName error exists
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void changePassword_withValidRequest_shouldReturnOk() throws Exception {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword")
                .newPassword("newPassword123!")
                .confirmPassword("newPassword123!")
                .build();

        doNothing().when(userService).changePassword(any(ChangePasswordRequest.class));

        mockMvc.perform(put("/api/users/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void changePassword_withMissingJwt_shouldReturnUnauthorized() throws Exception {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword")
                .newPassword("newPassword")
                .confirmPassword("newPassword")
                .build();

        mockMvc.perform(put("/api/users/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void changePassword_withIncorrectCurrentPassword_shouldReturnBadRequest() throws Exception {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("wrongPassword")
                .newPassword("newPassword123!")
                .confirmPassword("newPassword123!")
                .build();

        doThrow(new BadCredentialsException("Incorrect current password."))
                .when(userService).changePassword(any(ChangePasswordRequest.class));

        mockMvc.perform(put("/api/users/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void changePassword_withMismatchedNewPasswords_shouldReturnBadRequest() throws Exception {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword")
                .newPassword("newPassword123!")
                .confirmPassword("differentPassword123!")
                .build();

        doThrow(new BadCredentialsException("New password and confirmation password do not match."))
                .when(userService).changePassword(any(ChangePasswordRequest.class));

        mockMvc.perform(put("/api/users/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void changePassword_withWeakPassword_shouldReturnBadRequest() throws Exception {
        // Password "password" is likely to be caught by the StrongPassword validator
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword")
                .newPassword("password")
                .confirmPassword("password")
                .build();

        // No need to mock the service call, as the validation should be triggered before
        mockMvc.perform(put("/api/users/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.newPassword").exists());
    }
}


