CREATE TABLE conversations (
    id UUID NOT NULL PRIMARY KEY,
    participant_one_id UUID NOT NULL,
    participant_two_id UUID NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_conversations_participant_one FOREIGN KEY (participant_one_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_conversations_participant_two FOREIGN KEY (participant_two_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_conversations_participants UNIQUE (participant_one_id, participant_two_id),
    CONSTRAINT chk_conversations_distinct_participants CHECK (participant_one_id <> participant_two_id)
);

CREATE INDEX idx_conversations_participant_one ON conversations (participant_one_id, updated_at);
CREATE INDEX idx_conversations_participant_two ON conversations (participant_two_id, updated_at);

CREATE TABLE conversation_messages (
    id UUID NOT NULL PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content VARCHAR(4000) NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_conversation_messages_conversation FOREIGN KEY (conversation_id)
        REFERENCES conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_messages_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_conversation_messages_history ON conversation_messages (conversation_id, created_at);