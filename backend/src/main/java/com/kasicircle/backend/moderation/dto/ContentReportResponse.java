package com.kasicircle.backend.moderation.dto;

import com.kasicircle.backend.moderation.domain.ReportReason;
import com.kasicircle.backend.moderation.domain.ReportStatus;
import com.kasicircle.backend.moderation.domain.ReportTargetType;

import java.time.Instant;
import java.util.UUID;

public record ContentReportResponse(
        UUID id,
        ReportTargetType targetType,
        UUID targetId,
        String targetSummary,
        ReportReason reason,
        String details,
        ReportStatus status,
        String moderationNote,
        Instant createdAt,
        Instant moderatedAt
) {
}
