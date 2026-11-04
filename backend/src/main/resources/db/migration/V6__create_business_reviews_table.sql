-- V6__create_business_reviews_table.sql
-- Store business customer ratings and reviews

CREATE TABLE IF NOT EXISTS business_reviews (
    id UUID NOT NULL,
    business_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment VARCHAR(1000),
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_business_reviews_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
    CONSTRAINT fk_business_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_business_reviews_business_user UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_reviews_business_id ON business_reviews (business_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_user_id ON business_reviews (user_id);

