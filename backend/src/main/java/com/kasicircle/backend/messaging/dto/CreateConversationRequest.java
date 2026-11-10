package com.kasicircle.backend.messaging.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateConversationRequest(@NotNull UUID participantId) {
}