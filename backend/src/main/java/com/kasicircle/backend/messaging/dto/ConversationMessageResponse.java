package com.kasicircle.backend.messaging.dto;

import java.time.Instant;
import java.util.UUID;

public record ConversationMessageResponse(
        UUID id,
        UUID senderId,
        String senderName,
        String content,
        Instant createdAt
) {
}