CREATE TABLE content_reports (
    id UUID NOT NULL PRIMARY KEY,
    reporter_id UUID,
    target_type VARCHAR(30) NOT NULL,
    target_id UUID NOT NULL,
    reason VARCHAR(30) NOT NULL,
    details VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    moderation_note VARCHAR(1000),
    moderated_by_id UUID,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    moderated_at TIMESTAMP(6) WITH TIME ZONE,
    CONSTRAINT fk_content_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_content_reports_moderator FOREIGN KEY (moderated_by_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_content_reports_target_type CHECK (target_type IN ('BUSINESS', 'WORKER_PROFILE', 'JOB', 'BUSINESS_REVIEW')),
    CONSTRAINT chk_content_reports_reason CHECK (reason IN ('SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'FRAUD', 'OTHER')),
    CONSTRAINT chk_content_reports_status CHECK (status IN ('OPEN', 'ACTIONED', 'DISMISSED'))
);

CREATE INDEX idx_content_reports_status_created ON content_reports (status, created_at);
CREATE INDEX idx_content_reports_target ON content_reports (target_type, target_id);
CREATE INDEX idx_content_reports_reporter ON content_reports (reporter_id);
