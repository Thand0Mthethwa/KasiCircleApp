package com.kasicircle.backend.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kasicircle.backend.auth.dto.LoginRequest;
import com.kasicircle.backend.auth.dto.RegisterRequest;
import com.kasicircle.backend.users.entity.Role;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc; 
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional // Rollback database changes after each test
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AuthenticationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @AfterEach
    void tearDown() {
        userRepository.deleteAll();
    }

    @Test
    void register_withValidData_shouldCreateUserAndReturnCreated() throws Exception {
        RegisterRequest request = new RegisterRequest("Jane", "Doe", "jane.doe@test.com", "+27821112222", "Password123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("jane.doe@test.com").orElseThrow();
        assertTrue(passwordEncoder.matches("Password123!", user.getPassword()));
    }

    @Test
    void register_withExistingEmail_shouldReturnConflict() throws Exception {
        // Arrange: Create an existing user
        User existingUser = User.builder()
                .firstName("Existing")
                .lastName("User")
                .email("existing.user@test.com")
                .password(passwordEncoder.encode("some-password"))
                .role(Role.USER)
                .build();
        userRepository.save(existingUser);

        RegisterRequest request = new RegisterRequest("Jane", "Doe", "existing.user@test.com", "+27821112222", "Password123!");

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void register_withInvalidData_shouldReturnBadRequest() throws Exception {
        // Email is blank
        RegisterRequest request = new RegisterRequest("Jane", "Doe", "", "+27821112222", "Password123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_withValidCredentials_shouldReturnToken() throws Exception {
        // Arrange: Create a user to log in with
        User user = User.builder()
                .firstName("Login")
                .lastName("User")
                .email("login.user@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .role(Role.USER)
                .enabled(true)
                .build();
        userRepository.save(user);

        LoginRequest request = new LoginRequest("login.user@test.com", "Password123!");

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", is(notNullValue())));
    }

    @Test
    void login_withInvalidPassword_shouldReturnUnauthorized() throws Exception {
        // Arrange: Create a user
        User user = User.builder()
                .firstName("Login")
                .lastName("User")
                .email("login.user@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .role(Role.USER)
                .enabled(true)
                .build();
        userRepository.save(user);

        LoginRequest request = new LoginRequest("login.user@test.com", "WrongPassword");

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_withNonExistentUser_shouldReturnUnauthorized() throws Exception {
        LoginRequest request = new LoginRequest("non.existent@test.com", "any-password");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_withDisabledUser_shouldReturnForbidden() throws Exception {
        // Arrange: Create a disabled user
        User user = User.builder()
                .firstName("Disabled")
                .lastName("User")
                .email("disabled.user@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .role(Role.USER)
                .enabled(false) // User is disabled
                .build(); 
        userRepository.save(user);

        LoginRequest request = new LoginRequest("disabled.user@test.com", "Password123!");

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}