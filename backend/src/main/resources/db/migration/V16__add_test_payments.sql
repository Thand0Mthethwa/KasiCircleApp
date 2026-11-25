CREATE TABLE payment_attempts (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES customer_orders(id),
    booking_id UUID REFERENCES service_bookings(id),
    provider VARCHAR(12) NOT NULL CHECK (provider IN ('PAYSTACK', 'MOCK')),
    reference VARCHAR(64) NOT NULL UNIQUE,
    expected_minor BIGINT NOT NULL CHECK (expected_minor > 0),
    verified_minor BIGINT,
    currency CHAR(3) NOT NULL CHECK (currency = 'ZAR'),
    provider_transaction_id BIGINT CHECK (provider_transaction_id > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN (
        'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'ABANDONED', 'REFUND_REQUIRED')),
    checkout_url VARCHAR(1024),
    last_check_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CHECK ((order_id IS NULL) <> (booking_id IS NULL)),
    CHECK ((status IN ('PAID', 'REFUND_REQUIRED')) = (verified_minor IS NOT NULL)),
    CHECK (verified_minor IS NULL OR (verified_minor = expected_minor AND provider_transaction_id IS NOT NULL)),
    UNIQUE (provider, provider_transaction_id)
);
CREATE INDEX payment_order_history ON payment_attempts(order_id, created_at DESC);
CREATE INDEX payment_booking_history ON payment_attempts(booking_id, created_at DESC);
CREATE UNIQUE INDEX payment_order_outstanding ON payment_attempts(order_id)
    WHERE order_id IS NOT NULL AND status IN ('PENDING', 'PROCESSING');
CREATE UNIQUE INDEX payment_booking_outstanding ON payment_attempts(booking_id)
    WHERE booking_id IS NOT NULL AND status IN ('PENDING', 'PROCESSING');
CREATE UNIQUE INDEX payment_order_confirmed ON payment_attempts(order_id) WHERE order_id IS NOT NULL AND status = 'PAID';
CREATE UNIQUE INDEX payment_booking_confirmed ON payment_attempts(booking_id) WHERE booking_id IS NOT NULL AND status = 'PAID';

CREATE TABLE payment_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payment_id UUID REFERENCES payment_attempts(id),
    event_key VARCHAR(180) UNIQUE,
    event_type VARCHAR(60) NOT NULL,
    status VARCHAR(20),
    received_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX payment_event_history ON payment_events(payment_id, id);

CREATE TABLE payment_cases (
    payment_id UUID NOT NULL REFERENCES payment_attempts(id),
    kind VARCHAR(10) NOT NULL CHECK (kind IN ('REFUND', 'DISPUTE')),
    state VARCHAR(16) NOT NULL CHECK (state IN ('REQUIRED', 'REQUESTED', 'PENDING', 'CONFIRMED', 'FAILED', 'DISPUTED')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (payment_id, kind)
);

CREATE FUNCTION route_closed_sale_payments() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('CANCELLED', 'REJECTED', 'DECLINED') THEN
        WITH affected AS (
            UPDATE payment_attempts SET status = 'REFUND_REQUIRED', updated_at = clock_timestamp()
            WHERE status = 'PAID' AND (
                (TG_TABLE_NAME = 'customer_orders' AND order_id = NEW.id) OR
                (TG_TABLE_NAME = 'service_bookings' AND booking_id = NEW.id)
            ) RETURNING id
        ), recorded AS (
            INSERT INTO payment_events(payment_id, event_type, status)
            SELECT id, 'SALE_CLOSED', 'REFUND_REQUIRED' FROM affected
        )
        INSERT INTO payment_cases(payment_id, kind, state)
        SELECT id, 'REFUND', 'REQUIRED' FROM affected ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER order_payment_after_close AFTER UPDATE OF status ON customer_orders
FOR EACH ROW EXECUTE FUNCTION route_closed_sale_payments();
CREATE TRIGGER booking_payment_after_close AFTER UPDATE OF status ON service_bookings
FOR EACH ROW EXECUTE FUNCTION route_closed_sale_payments();

ALTER TABLE notifications DROP CONSTRAINT chk_notifications_type;
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_type CHECK (
    type IN ('JOB_APPLICATION', 'APPLICATION_STATUS', 'MESSAGE', 'BOOKING_UPDATE', 'ORDER_UPDATE', 'PAYMENT_UPDATE')
);
