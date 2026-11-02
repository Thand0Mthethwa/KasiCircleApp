-- V2__expand_user_field_lengths.sql
-- Widen user name and email fields to accommodate realistic user inputs
-- Non-destructive column expansion for existing records

ALTER TABLE users ALTER COLUMN first_name TYPE VARCHAR(50);
ALTER TABLE users ALTER COLUMN last_name TYPE VARCHAR(60);
ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(254);

