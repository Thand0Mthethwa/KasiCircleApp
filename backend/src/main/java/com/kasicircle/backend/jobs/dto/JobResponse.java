package com.kasicircle.backend.jobs.dto;

import com.kasicircle.backend.jobs.domain.EmploymentType;
import com.kasicircle.backend.jobs.domain.JobStatus;

import java.time.Instant;
import java.util.UUID;

public record JobResponse(
        UUID id,
        UUID employerId,
        String employerName,
        String title,
        String description,
        String category,
        EmploymentType employmentType,
        JobStatus status,
        String city,
        String province,
        Instant createdAt,
        Instant updatedAt
) {
}
