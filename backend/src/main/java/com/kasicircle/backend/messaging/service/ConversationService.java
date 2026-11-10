package com.kasicircle.backend.messaging.service;

import com.kasicircle.backend.messaging.dto.ConversationMessageResponse;
import com.kasicircle.backend.messaging.dto.ConversationResponse;
import com.kasicircle.backend.messaging.dto.CreateConversationRequest;
import com.kasicircle.backend.messaging.dto.SendMessageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ConversationService {

    List<ConversationResponse> getConversations();

    ConversationResponse createConversation(CreateConversationRequest request);

    Page<ConversationMessageResponse> getMessages(UUID conversationId, Pageable pageable);

    ConversationMessageResponse sendMessage(UUID conversationId, SendMessageRequest request);
}