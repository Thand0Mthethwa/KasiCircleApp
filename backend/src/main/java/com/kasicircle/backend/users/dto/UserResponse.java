package com.kasicircle.backend.users.dto;

import com.kasicircle.backend.users.entity.Role;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private Role role;
    private Instant createdAt;
    private Instant updatedAt;
}
