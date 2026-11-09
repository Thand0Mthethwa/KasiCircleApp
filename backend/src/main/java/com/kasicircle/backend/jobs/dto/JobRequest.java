package com.kasicircle.backend.jobs.dto;

import com.kasicircle.backend.jobs.domain.EmploymentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record JobRequest(
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 4000) String description,
        @NotBlank @Size(max = 60) String category,
        @NotNull EmploymentType employmentType,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 100) String province
) {
}
