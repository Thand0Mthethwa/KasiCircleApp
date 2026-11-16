-- Existing listings remain unmapped until their owners explicitly publish a pin.
ALTER TABLE businesses
    ADD COLUMN latitude DOUBLE PRECISION,
    ADD COLUMN longitude DOUBLE PRECISION,
    ADD COLUMN location_public BOOLEAN NOT NULL DEFAULT FALSE,
    ADD CONSTRAINT businesses_location_pair CHECK ((latitude IS NULL) = (longitude IS NULL)),
    -- PostgreSQL orders NaN above finite values; these upper/lower bounds also reject NaN and infinities.
    ADD CONSTRAINT businesses_latitude_range CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    ADD CONSTRAINT businesses_longitude_range CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    ADD CONSTRAINT businesses_public_location_pair CHECK (NOT location_public OR (latitude IS NOT NULL AND longitude IS NOT NULL));
