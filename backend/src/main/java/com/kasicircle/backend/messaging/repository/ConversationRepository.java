package com.kasicircle.backend.messaging.repository;

import com.kasicircle.backend.messaging.domain.Conversation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @EntityGraph(attributePaths = {"participantOne", "participantTwo"})
    List<Conversation> findByParticipantOneIdOrParticipantTwoIdOrderByUpdatedAtDesc(
            UUID participantOneId,
            UUID participantTwoId
    );

    @EntityGraph(attributePaths = {"participantOne", "participantTwo"})
    Optional<Conversation> findByParticipantOneIdAndParticipantTwoId(UUID participantOneId, UUID participantTwoId);
}