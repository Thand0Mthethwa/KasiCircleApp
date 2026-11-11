# Current database migration guide

This guide covers the current V1–V11 marketplace schema. The older `backend/MIGRATIONS.md` contains foundation-era notes and should not be used as an unattended production recovery procedure. Use [deployment](DEPLOYMENT.md) for rollout/backup/rollback decisions.

| Migration | Schema effect | Existing-data considerations |
|---|---|---|
| V1 | users, businesses, foreign keys/indexes | IF NOT EXISTS is not a guarantee that an existing schema matches the entity model. |
| V2 | Widen user names and email | Expands values without truncation. |
| V3 | Account type | Backfills RESIDENT by default; constrained account types. |
| V4 | Unique business owner | Existing duplicate owners must be resolved before execution. |
| V5 | Business image metadata | Unique partial cover index permits one cover per business. |
| V6 | Business reviews | Rating bounds, foreign keys, unique business/reviewer. |
| V7 | Worker profiles, skills, service categories | Unique owner; collection primary keys; user/profile foreign keys. |
| V8 | Jobs and applications | Constrained statuses/types; unique job/applicant. |
| V9 | Conversations and messages | Distinct participants, unique ordered pair and history indexes. |
| V10 | Notifications | Recipient/type constraints and unread/history indexes. |
| V11 | Content reports | Reason/type/status constraints; nullable reporter/moderator retained on user deletion. Target IDs are polymorphic and validated by the service. |

Flyway runs at application startup. Hibernate uses `ddl-auto=validate`; do not enable update/create in production. Applied migrations are immutable. Add a higher-numbered migration for corrections, with appropriate defaults/nullability and a staged plan for any destructive operation.

On 2026-11-12, the packaged Java 21 application applied all 11 migrations successfully to a fresh isolated PostgreSQL 18 database. `flyway_schema_history` contained versions 1–11 with `success=true`; the application served public business reads after Hibernate validation. Subsequent browser-harness starts reused this migrated database successfully. The database is disposable and separate from the developer's existing database.

CI is configured for PostgreSQL 16 and runs a packaged startup probe followed by real browser journeys. That hosted workflow has not been executed by this task because no push is authorized. Local PostgreSQL 18 evidence does not claim an executed PostgreSQL 16 CI result.

Unit/repository tests use H2 or mocks with Flyway disabled. They cannot substitute for real PostgreSQL migration verification. An unknown historical database still requires backup/restore rehearsal and data preflight; fresh/restart results do not prove its upgrade safety.
