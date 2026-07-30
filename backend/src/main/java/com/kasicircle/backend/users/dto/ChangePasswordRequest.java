package com.kasicircle.backend.users.dto;

import com.kasicircle.backend.shared.validation.StrongPassword;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record ChangePasswordRequest(
        @NotBlank(message = "Current password cannot be blank")
        String currentPassword,

        @NotBlank(message = "New password cannot be blank")
        @StrongPassword
        String newPassword,

        @NotBlank(message = "Confirm password cannot be blank")
        String confirmPassword
) {
}
