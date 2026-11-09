package com.kasicircle.backend.workers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record WorkerProfileRequest(
        @NotBlank @Size(max = 120) String headline,
        @NotBlank @Size(max = 2000) String bio,
        @NotEmpty @Size(max = 20) Set<@NotBlank @Size(max = 60) String> skills,
        @NotEmpty @Size(max = 20) Set<@NotBlank @Size(max = 60) String> serviceCategories,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 100) String province
) {
}
