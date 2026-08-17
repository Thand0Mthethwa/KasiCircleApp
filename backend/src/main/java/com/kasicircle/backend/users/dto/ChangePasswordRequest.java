package com.kasicircle.backend.users.dto;

import com.kasicircle.backend.shared.validation.StrongPassword;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record ChangePasswordRequest(
        @NotBlank(message = "Current password cannot be blank")
        String currentPassword,

        @NotBlank(message = "New password cannot be blank")
        @Size(min = 8, message = "New password must be at least 8 characters long")
        @StrongPassword
        String newPassword,

        @NotBlank(message = "Confirm password cannot be blank")
        String confirmPassword
) {
}
