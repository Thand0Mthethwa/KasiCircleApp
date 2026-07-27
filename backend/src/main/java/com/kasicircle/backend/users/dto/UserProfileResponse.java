package com.kasicircle.backend.users.dto;

import com.kasicircle.backend.users.entity.Role;
import lombok.Builder;

import java.util.UUID;

/**
 * DTO for returning the profile information of the authenticated user.
 * This record is an immutable data carrier.
 */
@Builder
public record UserProfileResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        String phoneNumber,
        Role role
) {
}