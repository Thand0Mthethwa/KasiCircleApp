CREATE TABLE products (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    image_id UUID REFERENCES business_images(id) ON DELETE SET NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    category VARCHAR(120) NOT NULL,
    price_minor INTEGER NOT NULL CHECK (price_minor BETWEEN 1 AND 100000000),
    available BOOLEAN NOT NULL,
    active BOOLEAN NOT NULL,
    stock INTEGER CHECK (stock >= 0),
    revision BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_business ON products(business_id, created_at DESC, id);

CREATE TABLE customer_orders (
    id UUID PRIMARY KEY,
    order_reference VARCHAR(40) NOT NULL UNIQUE,
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    business_name VARCHAR(255) NOT NULL,
    collection_address VARCHAR(800) NOT NULL,
    customer_id UUID NOT NULL REFERENCES users(id),
    provider_id UUID NOT NULL REFERENCES users(id),
    customer_name VARCHAR(64) NOT NULL,
    request_key UUID NOT NULL,
    request_fingerprint CHAR(64) NOT NULL,
    notes VARCHAR(1000) NOT NULL,
    total_minor BIGINT NOT NULL CHECK (total_minor > 0),
    status VARCHAR(24) NOT NULL CHECK (status IN (
        'PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_COLLECTION', 'COMPLETED', 'REJECTED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (customer_id, request_key),
    CHECK (customer_id <> provider_id)
);
CREATE INDEX idx_orders_customer ON customer_orders(customer_id, created_at DESC, id);
CREATE INDEX idx_orders_provider ON customer_orders(provider_id, created_at DESC, id);

CREATE TABLE customer_order_items (
    order_id UUID NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name VARCHAR(120) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 100),
    price_minor INTEGER NOT NULL CHECK (price_minor BETWEEN 1 AND 100000000),
    tracked BOOLEAN NOT NULL,
    PRIMARY KEY (order_id, product_id)
);
CREATE INDEX idx_order_items_product ON customer_order_items(product_id, order_id) WHERE tracked;

CREATE TABLE customer_order_status_history (
    order_id UUID NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
    sequence BIGINT GENERATED ALWAYS AS IDENTITY,
    status VARCHAR(24) NOT NULL CHECK (status IN (
        'PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_COLLECTION', 'COMPLETED', 'REJECTED', 'CANCELLED')),
    actor_id UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (order_id, sequence)
);

ALTER TABLE notifications DROP CONSTRAINT chk_notifications_type;
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_type
    CHECK (type IN ('JOB_APPLICATION', 'APPLICATION_STATUS', 'MESSAGE', 'BOOKING_UPDATE', 'ORDER_UPDATE'));
