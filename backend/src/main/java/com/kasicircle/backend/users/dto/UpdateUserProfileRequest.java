package com.kasicircle.backend.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

/**
 * DTO for updating the user's profile information.
 */
@Builder
public record UpdateUserProfileRequest(
        @NotBlank(message = "First name cannot be blank")
        @Size(max = 15, message = "First name must be less than or equal to 15 characters")
        String firstName,

        @NotBlank(message = "Last name cannot be blank")
        @Size(max = 15, message = "Last name must be less than or equal to 15 characters")
        String lastName,

        @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Phone number must be between 10 and 15 digits and may start with a plus sign")
        @Size(max = 15, message = "Phone number must be less than or equal to 15 characters")
        String phoneNumber
) {
}
