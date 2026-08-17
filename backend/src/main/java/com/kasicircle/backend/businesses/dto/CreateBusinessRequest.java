package com.kasicircle.backend.businesses.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record CreateBusinessRequest(
        @NotBlank(message = "Business name is required.")
        String name,

        @NotBlank(message = "Business description is required.")
        String description,

        @NotBlank(message = "Business phone number is required.")
        String phoneNumber,

        @Email(message = "A valid email address is required.")
        @NotBlank(message = "Business email is required.")
        String email,

        @NotBlank(message = "Business category is required.")
        String category,

        @NotBlank(message = "Business address is required.")
        String address,

        @NotBlank(message = "Business city is required.")
        String city,

        @NotBlank(message = "Business province is required.")
        String province
) {
}
