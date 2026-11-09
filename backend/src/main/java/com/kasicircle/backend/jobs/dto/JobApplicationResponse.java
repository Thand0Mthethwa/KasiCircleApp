package com.kasicircle.backend.jobs.dto;

import com.kasicircle.backend.jobs.domain.ApplicationStatus;

import java.time.Instant;
import java.util.UUID;

public record JobApplicationResponse(
        UUID id,
        UUID jobId,
        String jobTitle,
        String employerName,
        UUID applicantId,
        String applicantName,
        String message,
        ApplicationStatus status,
        Instant createdAt
) {
}
