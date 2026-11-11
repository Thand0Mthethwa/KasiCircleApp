# Deployment and operations

This is a runbook; no infrastructure is provisioned or deployed by this repository task.

## Build requirements

Use Java 21, Maven, Node.js 22.12+ (or compatible newer LTS), npm, PostgreSQL, and optionally Cloudinary for image uploads. Use the committed npm lockfile. The API defaults to port 8081. Production assets are `frontend/dist`; the executable API artifact is `backend/target/backend-0.0.1-SNAPSHOT.jar`.

```bash
cd backend
mvn --batch-mode verify
cd ../frontend
npm ci
npm test -- --maxWorkers=1 --no-file-parallelism
npm run lint
# Set this to the intended HTTPS API origin before building.
VITE_API_BASE_URL=https://api.example.com npm run build
```

## Runtime configuration

| Variable | Requirement |
|---|---|
| DB_URL | PostgreSQL JDBC URL; defaults to local kasicircle for development. Set production address explicitly and require encrypted transport appropriate to the host. |
| DB_USERNAME / DB_PASSWORD | Required; provision a dedicated database user. Migration credentials need DDL access. Never reuse QA credentials. |
| JWT_SECRET | Required; unique randomly generated secret with at least 32 bytes of UTF-8 key material. Store in a secret manager. Rotation invalidates existing tokens. |
| JWT_EXPIRATION | Positive duration in milliseconds, default 86400000. |
| APP_CORS_ALLOWED_ORIGIN | Exact frontend origin, including scheme/port. One origin supported, default http://localhost:5173. |
| CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET | Required for functioning image uploads; omit only when explicitly accepting unavailable image upload functionality. |
| SERVER_PORT | Optional Spring environment override of default 8081. |

Vite variables are public build configuration, never a place for secrets. Spring Boot does not automatically load a root `.env` file; export backend variables or configure the process manager/host to inject them.

## Database rollout

1. Take a consistent backup and verify restoration in an isolated environment before upgrading an existing database.
2. Inspect `flyway_schema_history` and preflight the migration constraints against current data. V4 requires unique business owners; pre-existing duplicates require an explicit data-resolution decision before rollout.
3. Rehearse migrations on a restored copy. Fresh-database success alone does not establish safety for an unknown historical database.
4. Start one API instance with production variables and `java -jar backend/target/backend-0.0.1-SNAPSHOT.jar`. Flyway applies pending immutable migrations and Hibernate validates the result. Stop rollout on errors; do not use automatic repair or Hibernate update to conceal mismatches.
5. Verify successful migration history and authenticated/public API smoke checks, then admit traffic.

Never edit an applied migration or remove history rows to bypass a checksum/DDL error. Diagnose first and add a forward migration. `baseline-on-migrate=true` at version 0 exists for legacy adoption; verify any nonempty database's provenance before allowing startup. Do not baseline an arbitrary production schema.

## Web serving and verification

Serve frontend static assets through an HTTPS web server/CDN with SPA fallback to `index.html` for application routes. Route API requests to the API origin without applying the frontend fallback. Terminate TLS at the host/reverse proxy, restrict database network access, and use the exact origin in CORS. Do not expose the Vite development server in production.

Smoke checks: public business/worker/job directories; registration/login; authorized profile update; review/rating refresh; job application and employer decision; message send/history; recipient notification; regular-user rejection from admin APIs. `/actuator/health` is authenticated in the current security chain, exposes no details, and should not be assumed to be a public load-balancer readiness URL. A public directory GET can serve as a basic HTTP startup probe; configure infrastructure readiness with its intended authentication policy.

## Administrator provisioning

Registration always creates USER accounts. Provision a named administrator through an authorized, audited database operation; there is no public role-change API. Verify the target account ID before changing its role and preserve an operational audit record. Do not ship default admin passwords/accounts. QA's role-promotion fixture is restricted to a disposable local database and is not a production provisioning command.

## Backup, rollback and incidents

Back up PostgreSQL and retain Cloudinary asset/storage identifiers. Test restores. Observe API error rates, failed login patterns, disk/storage usage and database health through the hosting platform; never log bearer tokens/passwords. Actuator health hides details.

For a failed release, stop new traffic and diagnose migration/schema compatibility before reverting the JAR. Schema changes are forward-only; if a database restore is necessary, coordinate its data-loss window and restore using the verified backup procedure. Reverting code does not undo migrations. Secret exposure requires rotation and session invalidation. Reported content currently requires a manual administrator action after recording a report disposition; ACTIONED alone does not hide it.

Remote GitHub Actions and deployment must be performed separately by an authorized operator. Local validation results are recorded in [release readiness](RELEASE_READINESS.md).
