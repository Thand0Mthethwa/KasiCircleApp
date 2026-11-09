package com.kasicircle.backend.jobs.dto;

import com.kasicircle.backend.jobs.domain.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record JobApplicationStatusRequest(@NotNull ApplicationStatus status) {
}
