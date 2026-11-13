-- Only for the dedicated, disposable kasicircle_qa database.
-- The guard runs before any schema write and aborts the entire transaction on mismatch.
BEGIN;
DO $guard$
BEGIN
    IF current_database() <> 'kasicircle_qa' THEN
        RAISE EXCEPTION 'Refusing E2E marker setup outside kasicircle_qa';
    END IF;
END
$guard$;
CREATE SCHEMA IF NOT EXISTS e2e_guard;
CREATE TABLE IF NOT EXISTS e2e_guard.identity (purpose text PRIMARY KEY);
INSERT INTO e2e_guard.identity VALUES ('kasicircle-isolated-e2e-v1')
ON CONFLICT (purpose) DO NOTHING;
COMMIT;
