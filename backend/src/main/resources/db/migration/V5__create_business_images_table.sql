-- V5__create_business_images_table.sql
-- Store business images metadata without storing binary data

CREATE TABLE IF NOT EXISTS business_images (
    id UUID NOT NULL,
    business_id UUID NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    storage_id VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    content_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    is_cover BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_business_images_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_business_images_business_id ON business_images (business_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_business_images_cover ON business_images (business_id) WHERE is_cover = TRUE;

