CREATE TABLE notifications (
    id UUID NOT NULL PRIMARY KEY,
    recipient_id UUID NOT NULL,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(120) NOT NULL,
    message VARCHAR(500) NOT NULL,
    resource_type VARCHAR(30) NOT NULL,
    resource_id UUID NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    read_at TIMESTAMP(6) WITH TIME ZONE,
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_notifications_type CHECK (type IN ('JOB_APPLICATION', 'APPLICATION_STATUS', 'MESSAGE'))
);

CREATE INDEX idx_notifications_recipient_created ON notifications (recipient_id, created_at);
CREATE INDEX idx_notifications_recipient_unread ON notifications (recipient_id, read_at);
