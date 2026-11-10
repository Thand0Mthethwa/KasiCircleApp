package com.kasicircle.backend.notifications.dto;

import com.kasicircle.backend.notifications.domain.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        String resourceType,
        UUID resourceId,
        Instant createdAt,
        Instant readAt
) {
}
