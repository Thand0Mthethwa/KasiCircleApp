-- Personal account avatars are independent of business gallery images.
ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(500);
ALTER TABLE users ADD COLUMN profile_image_public_id VARCHAR(255);

-- Transactional cleanup outbox: old images are deleted only after reference changes commit.
CREATE TABLE user_profile_image_cleanup (
    id UUID PRIMARY KEY,
    public_id VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0
);
