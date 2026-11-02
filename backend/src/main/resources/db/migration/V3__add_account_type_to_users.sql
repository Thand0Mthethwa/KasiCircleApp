-- V3__add_account_type_to_users.sql
-- Add account_type column to users table with safe default RESIDENT

ALTER TABLE users 
    ADD COLUMN account_type VARCHAR(20) DEFAULT 'RESIDENT' NOT NULL;

ALTER TABLE users 
    ADD CONSTRAINT users_account_type_check 
    CHECK (account_type IN ('RESIDENT', 'WORKER', 'BUSINESS'));

