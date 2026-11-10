package com.kasicircle.backend.messaging.controller;

import com.kasicircle.backend.messaging.dto.ConversationMessageResponse;
import com.kasicircle.backend.messaging.dto.ConversationResponse;
import com.kasicircle.backend.messaging.dto.CreateConversationRequest;
import com.kasicircle.backend.messaging.dto.SendMessageRequest;
import com.kasicircle.backend.messaging.service.ConversationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getConversations() {
        return ResponseEntity.ok(conversationService.getConversations());
    }

    @PostMapping
    public ResponseEntity<ConversationResponse> createConversation(
            @Valid @RequestBody CreateConversationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(conversationService.createConversation(request));
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<Page<ConversationMessageResponse>> getMessages(
            @PathVariable UUID conversationId,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(conversationService.getMessages(conversationId, pageable));
    }

    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<ConversationMessageResponse> sendMessage(
            @PathVariable UUID conversationId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversationService.sendMessage(conversationId, request));
    }
}