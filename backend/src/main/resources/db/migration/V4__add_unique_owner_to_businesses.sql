-- V4__add_unique_owner_to_businesses.sql
-- Enforce one business listing per account at the database level

ALTER TABLE businesses
    ADD CONSTRAINT uq_businesses_owner_id UNIQUE (owner_id);

