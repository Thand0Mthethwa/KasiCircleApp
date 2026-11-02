# Database Migrations with Flyway — KasiCircle Backend

## 1. Overview & Motivation

Prior to Sprint 5.3.1, the KasiCircle backend relied on Hibernate's automatic schema tool (`spring.jpa.hibernate.ddl-auto=update`). While convenient in early prototyping, `ddl-auto=update` has severe limitations and risks in production and collaborative environments:
- It cannot reliably perform column type modifications, index renaming, or constraint refactoring.
- It provides no audit trail of database alterations.
- It can silently lead to schema divergence across development, testing, staging, and production databases.
- It carries risk of unexpected runtime DDL execution or locking issues during application startup.

Flyway was introduced to provide **versioned, reproducible, deterministic, and auditable database migrations**. Starting with Sprint 5.3.1:
- Flyway is the sole source of truth for DDL evolution.
- Hibernate is restricted to `spring.jpa.hibernate.ddl-auto=validate`, ensuring entities conform to the database schema without performing runtime DDL alterations.

---

## 2. Architecture & Configuration

Flyway is integrated via Spring Boot Starter and the PostgreSQL database module:
- `org.flywaydb:flyway-core`
- `org.flywaydb:flyway-database-postgresql`

Configuration in `application.properties`:
```properties
# Flyway Migration Configuration
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.baseline-version=0
spring.flyway.locations=classpath:db/migration

# Hibernate Validation
spring.jpa.hibernate.ddl-auto=validate
```

### Existing Database Baselining
- When connected to a pre-existing database that contains tables created prior to Flyway, `baseline-on-migrate=true` creates the `flyway_schema_history` table at baseline version `0`.
- Flyway then detects that `V1` and `V2` are newer than `0` and evaluates them in order.
- To ensure zero disruption and 100% data preservation:
  - `V1__initial_schema.sql` uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`. If tables already exist, it does not overwrite or drop them.
  - `V2__expand_user_field_lengths.sql` executes non-destructive `ALTER TABLE users ALTER COLUMN ... TYPE ...;` statements, widening column limits safely while keeping all existing records intact.

### Fresh Database Initialization
- On a completely fresh, empty database, Flyway starts with no baseline, applies `V1__initial_schema.sql` (creating initial tables, constraints, and indexes), and then applies `V2__expand_user_field_lengths.sql`.
- Hibernate then validates that the JPA entities (`User`, `Business`) match the generated schema.

---

## 3. Migration File Naming & Structure

Migration files reside in:
`backend/src/main/resources/db/migration/`

Files must strictly follow Flyway's naming pattern:
`V{version}__{description}.sql`

- **Prefix**: `V` (uppercase)
- **Version**: Monotonically increasing numbers (e.g. `1`, `2`, `3` or `1.1`, `1.2`)
- **Separator**: Two underscores `__`
- **Description**: Snake_case summary of the migration (e.g. `initial_schema`, `expand_user_field_lengths`)
- **Suffix**: `.sql`

### Current Migration History:
1. [`V1__initial_schema.sql`](file:///home/tsmthethwa/Projects/KasiCircle/KasiCircleApp/backend/src/main/resources/db/migration/V1__initial_schema.sql) — Baseline tables (`users`, `businesses`), indexes, and foreign keys with `IF NOT EXISTS`.
2. [`V2__expand_user_field_lengths.sql`](file:///home/tsmthethwa/Projects/KasiCircle/KasiCircleApp/backend/src/main/resources/db/migration/V2__expand_user_field_lengths.sql) — Expands `first_name` (50), `last_name` (60), and `email` (254).
3. [`V3__add_account_type_to_users.sql`](file:///home/tsmthethwa/Projects/KasiCircle/KasiCircleApp/backend/src/main/resources/db/migration/V3__add_account_type_to_users.sql) — Adds `account_type` column to `users` with default `'RESIDENT'` and check constraint (`RESIDENT`, `WORKER`, `BUSINESS`).

---

## 4. Running Migrations

Migrations execute automatically whenever the backend application boots up.

To run migrations during local development:
```bash
cd backend
mvn spring-boot:run
```

To run against the test database (H2 in PostgreSQL compatibility mode):
```bash
mvn test
```

---

## 5. Rules for Writing Migrations

All contributors must adhere to these database safety rules:

1. **Zero Destructive Actions**:
   - **NEVER** use `DROP TABLE`, `DROP SCHEMA`, or `TRUNCATE` in a migration.
   - Do not drop columns without a multi-phase deprecation plan.
2. **Backward Compatibility**:
   - Column modifications must be expanding (e.g. increasing length from `VARCHAR(15)` to `VARCHAR(50)`), never shrinking existing populated columns.
   - When adding new columns to existing tables, provide a `DEFAULT` value or allow `NULL` so existing rows remain valid.
3. **Idempotence**:
   - Use `IF NOT EXISTS` for table, index, or constraint creation where supported.
4. **Immutability of Applied Migrations**:
   - Once a migration script has been merged to `develop` / `main` or executed in any shared environment, **NEVER** edit or delete it.
   - Any bug fixes or schema adjustments must be performed by authoring a new migration with a higher version number (e.g. `V3__...`).

---

## 6. Troubleshooting & Recovery

### Failed Migration during Local Development
If a migration script encounters a syntax error or constraint conflict during development:
1. Inspect the application logs and note which statement failed.
2. Fix the error in the SQL script or manually undo the failing DDL in your local database.
3. Repair the Flyway schema history table:
   - If using Maven Flyway plugin:
     ```bash
     mvn flyway:repair
     ```
   - Or directly in PostgreSQL:
     ```sql
     DELETE FROM flyway_schema_history WHERE success = false;
     ```
4. Restart the Spring Boot backend to re-run the corrected migration.

