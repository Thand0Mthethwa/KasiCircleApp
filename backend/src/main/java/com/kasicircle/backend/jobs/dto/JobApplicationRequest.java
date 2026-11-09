package com.kasicircle.backend.jobs.dto;

import jakarta.validation.constraints.Size;

public record JobApplicationRequest(@Size(max = 1000) String message) {
}
