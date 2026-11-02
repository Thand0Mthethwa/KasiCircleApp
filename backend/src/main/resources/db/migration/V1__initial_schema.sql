-- V1__initial_schema.sql
-- Baseline schema for KasiCircle application
-- Safe for both fresh database initialization and adopting existing databases

CREATE TABLE IF NOT EXISTS users (
    id UUID NOT NULL,
    first_name VARCHAR(15) NOT NULL,
    last_name VARCHAR(15) NOT NULL,
    email VARCHAR(26) NOT NULL UNIQUE,
    phone_number VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'ADMIN')),
    enabled BOOLEAN NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS businesses (
    id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    province VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE,
    updated_at TIMESTAMP(6) WITH TIME ZONE,
    PRIMARY KEY (id),
    CONSTRAINT fk_businesses_owner FOREIGN KEY (owner_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses (owner_id);

