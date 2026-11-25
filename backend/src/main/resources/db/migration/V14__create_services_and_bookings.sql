CREATE TABLE service_offerings (
    id UUID PRIMARY KEY,
    provider_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES worker_profiles(id) ON DELETE SET NULL,
    provider_type VARCHAR(10) NOT NULL CHECK (provider_type IN ('BUSINESS', 'WORKER')),
    name VARCHAR(120) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    category VARCHAR(255) NOT NULL,
    price_model VARCHAR(20) NOT NULL CHECK (price_model IN ('FIXED', 'STARTING', 'QUOTE')),
    price NUMERIC(12,2),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 15 AND 1440),
    active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CHECK ((provider_type = 'BUSINESS' AND worker_id IS NULL) OR
           (provider_type = 'WORKER' AND business_id IS NULL)),
    CHECK ((price_model = 'QUOTE' AND price IS NULL) OR
           (price_model <> 'QUOTE' AND price IS NOT NULL AND price >= 0))
);
CREATE INDEX idx_service_business ON service_offerings(business_id);
CREATE INDEX idx_service_worker ON service_offerings(worker_id);
CREATE INDEX idx_service_owner ON service_offerings(provider_owner_id);

CREATE TABLE service_bookings (
    id UUID PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES service_offerings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_key UUID NOT NULL,
    service_name VARCHAR(120) NOT NULL,
    provider_name VARCHAR(255) NOT NULL,
    customer_name VARCHAR(64) NOT NULL,
    work_description VARCHAR(2000) NOT NULL,
    service_area VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 15 AND 1440),
    requested_at TIMESTAMPTZ NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    price_model VARCHAR(20) NOT NULL CHECK (price_model IN ('FIXED', 'STARTING', 'QUOTE')),
    agreed_price NUMERIC(12,2) CHECK (agreed_price >= 0),
    proposed_at TIMESTAMPTZ,
    proposed_price NUMERIC(12,2) CHECK (proposed_price >= 0),
    status VARCHAR(20) NOT NULL CHECK (status IN
        ('REQUESTED', 'PROPOSED', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED')),
    revision BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (customer_id, request_key),
    CHECK (customer_id <> provider_owner_id),
    CHECK (ends_at > scheduled_at),
    CHECK ((status = 'PROPOSED') = (proposed_at IS NOT NULL))
);
CREATE INDEX idx_booking_customer ON service_bookings(customer_id, created_at);
CREATE INDEX idx_booking_provider ON service_bookings(provider_owner_id, created_at);
CREATE INDEX idx_booking_confirmed_slot ON service_bookings(provider_owner_id, scheduled_at, ends_at)
    WHERE status IN ('ACCEPTED', 'IN_PROGRESS');

ALTER TABLE notifications DROP CONSTRAINT chk_notifications_type;
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_type
    CHECK (type IN ('JOB_APPLICATION', 'APPLICATION_STATUS', 'MESSAGE', 'BOOKING_UPDATE'));
