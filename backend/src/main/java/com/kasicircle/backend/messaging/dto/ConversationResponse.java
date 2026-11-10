package com.kasicircle.backend.messaging.dto;

import java.time.Instant;
import java.util.UUID;

public record ConversationResponse(
        UUID id,
        UUID participantId,
        String participantName,
        Instant updatedAt
) {
}