package com.kasicircle.backend.users.controller;

import com.kasicircle.backend.auth.jwt.JwtService;
import com.kasicircle.backend.users.dto.UserResponse;
import com.kasicircle.backend.users.entity.Role;
import com.kasicircle.backend.users.exception.UserNotFoundException;
import com.kasicircle.backend.users.service.CustomUserDetailsService;
import com.kasicircle.backend.users.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    @Test
    @WithMockUser(username = "test@example.com")
    void getCurrentUser_withValidJwt_shouldReturnOk() throws Exception {
        UserResponse userResponse = UserResponse.builder()
                .id(UUID.randomUUID())
                .firstName("Test")
                .lastName("User")
                .email("test@example.com")
                .role(Role.USER)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(userService.getCurrentUser()).thenReturn(userResponse);

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
}
