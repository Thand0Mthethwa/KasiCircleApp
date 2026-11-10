package com.kasicircle.backend.moderation.dto;

import com.kasicircle.backend.moderation.domain.ReportReason;
import com.kasicircle.backend.moderation.domain.ReportTargetType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateReportRequest(
        @NotNull ReportTargetType targetType,
        @NotNull UUID targetId,
        @NotNull ReportReason reason,
        @Size(max = 1000) String details
) {
}
