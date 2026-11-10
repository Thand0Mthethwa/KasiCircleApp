package com.kasicircle.backend.messaging.repository;

import com.kasicircle.backend.messaging.domain.ConversationMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, UUID> {

    @EntityGraph(attributePaths = "sender")
    Page<ConversationMessage> findByConversationId(UUID conversationId, Pageable pageable);
}