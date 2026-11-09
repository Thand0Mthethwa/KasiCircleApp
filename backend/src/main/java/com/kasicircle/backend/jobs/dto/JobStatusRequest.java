package com.kasicircle.backend.jobs.dto;

import com.kasicircle.backend.jobs.domain.JobStatus;
import jakarta.validation.constraints.NotNull;

public record JobStatusRequest(@NotNull JobStatus status) {
}
