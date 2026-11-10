package com.kasicircle.backend.moderation.dto;

import com.kasicircle.backend.moderation.domain.ReportStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ModerationDecisionRequest(
        @NotNull ReportStatus status,
        @Size(max = 1000) String moderationNote
) {
}
