package com.kasicircle.backend.messaging.domain;

import com.kasicircle.backend.users.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversations", uniqueConstraints = {
        @UniqueConstraint(
                name = "uq_conversations_participants",
                columnNames = {"participant_one_id", "participant_two_id"}
        )
})
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant_one_id", nullable = false)
    private User participantOne;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant_two_id", nullable = false)
    private User participantTwo;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getParticipantOne() { return participantOne; }
    public void setParticipantOne(User participantOne) { this.participantOne = participantOne; }
    public User getParticipantTwo() { return participantTwo; }
    public void setParticipantTwo(User participantTwo) { this.participantTwo = participantTwo; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public boolean hasParticipant(UUID userId) {
        return participantOne.getId().equals(userId) || participantTwo.getId().equals(userId);
    }

    public User otherParticipant(UUID userId) {
        return participantOne.getId().equals(userId) ? participantTwo : participantOne;
    }
}