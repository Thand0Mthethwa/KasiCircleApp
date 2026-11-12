# Running KasiCircle Backend locally

Use Java 21, Maven and an existing local PostgreSQL database. Local startup and a passing test suite are separate checks: backend tests use H2/mocks, while a normal application launch uses PostgreSQL, Flyway and Hibernate validation.

## Private local configuration

Open the repository root in VS Code, not a Java package directory. The tracked `.vscode/launch.json` uses `backend/.env.local` through the Java debugger's `envFile` setting; the Run task loads the same file. Spring Boot does not automatically load dotenv files when Maven is run directly. See the official [Java debugger configuration](https://code.visualstudio.com/docs/java/java-debugging#_configuration-options) and [Spring Boot external configuration](https://docs.spring.io/spring-boot/3.5/reference/features/external-config.html) references.

For a new checkout, create a private local file and a random signing key without printing it. This preserves an existing `.env.local`:

```bash
cd backend
umask 077
if [ ! -e .env.local ]; then
  sed '/^JWT_SECRET=/d' .env.example > .env.local
  printf 'JWT_SECRET=' >> .env.local
  openssl rand -hex 32 >> .env.local
fi
chmod 600 .env.local
```

Edit `backend/.env.local` privately in VS Code. Fill `DB_USERNAME` and `DB_PASSWORD` with the credentials for your **existing** PostgreSQL account, and set `DB_URL` to its database. The default URL in the example is `jdbc:postgresql://localhost:5432/kasicircle`. A template does not create a database/account or set its password. Do not paste credentials into chat, issue reports, terminal output or tracked files.

The private file must be compatible with a Bash environment file and the Java debugger's dotenv loader. Use simple `KEY=value` assignments, single-quote values containing spaces or shell-special characters so Bash does not expand them, and do not add shell commands. The tracked example intentionally has no working password or sample JWT signing secret.

| Variable | Local requirement |
|---|---|
| DB_URL | Existing PostgreSQL JDBC URL; local default uses port 5432 and database kasicircle. |
| DB_USERNAME / DB_PASSWORD | Required existing database-account credentials. |
| JWT_SECRET | Required private random key, at least 32 UTF-8 bytes. The setup above generates a new local key without displaying it. |
| JWT_EXPIRATION | Optional positive milliseconds; example/default is 86400000. |
| APP_CORS_ALLOWED_ORIGIN | Frontend origin; local example uses http://localhost:5173. |
| CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET | Optional for application startup; required for functioning business-image uploads. Keep values private. |

If Cloudinary credentials were previously placed inline in a launch file or exposed in diagnostics, rotate them with the provider before relying on them for image operations. The safe launch configuration contains no credentials; private local settings stay ignored by Git. Never reuse CI keys/passwords in this file.

## Start from VS Code

The installed Java extension pack/debugger is required. Open the repository root so `${workspaceFolder}/backend` resolves to the Maven project.

- Select **BackendApplication** in Run and Debug and press F5 (or Run Without Debugging). The prelaunch task checks that required values exist without printing them, then the Java debugger reads `.env.local` and uses the backend working directory.
- Alternatively select **Tasks: Run Task → Run KasiCircle Backend**. This sources the same private file and runs `mvn spring-boot:run` in `backend`.
- Stop the existing backend before using a second launch method; only one process can listen on 8081.
- **Test KasiCircle Backend** runs tests separately. **Run Backend and Tests** runs tests first, then starts the backend. This avoids simultaneous Maven builds and prevents the long-running backend from blocking the test task.

The application should stay running in the integrated terminal/debug session until explicitly stopped. A configuration review or a passing Maven test run does not prove that an actual VS Code debug session has started successfully.

## Start from a terminal

From the repository root:

```bash
cd backend
# Load only your own trusted local file. Disable tracing so assignments stay private.
set +x
set -a
source .env.local
set +a
mvn spring-boot:run
```

Keep that terminal open. A bare `mvn spring-boot:run` without exported variables does not read `.env.local` automatically. Missing required configuration must be corrected locally rather than replaced with hardcoded defaults.

## Verify the real application

Check PostgreSQL readiness and authenticate using your configured account (the password prompt is hidden; adjust host/database if using a different URL):

```bash
pg_isready -h localhost -p 5432
psql -h localhost -p 5432 -U "$DB_USERNAME" -d kasicircle -W -c 'SELECT 1;'
```

A ready PostgreSQL service alone does not prove that your account can connect or that the intended database exists. Startup must also complete Flyway migration validation and Hibernate schema validation. Inspect the log for successful application startup and query `flyway_schema_history` using an authorized account. Do not edit applied migrations, delete data or repair migration history just to bypass a failure. See [migration safety](docs/DATABASE_MIGRATIONS.md).

After Spring Boot reports successful startup on port 8081, test the public API:

```bash
curl --fail http://localhost:8081/api/businesses
```

`GET /actuator/health` is **authenticated** under the existing Spring Security policy. An anonymous request returning 401 means the endpoint is protected, not that health is UP. Verify `{"status":"UP"}` with a valid authenticated session/token without printing the token. Do not weaken security just to make this probe public. A stopped application/connection refusal is a different result from a protected endpoint's 401.

## Tests and common startup errors

```bash
cd backend
mvn --batch-mode test
```

- `Could not resolve placeholder 'JWT_SECRET'`: the launching process did not receive the required signing key. Check the private file, selected VS Code launch entry and terminal exports.
- Missing database variables, authentication failure or connection refusal: verify environment presence, the actual service and the existing account/database separately. Do not assume service downtime from a sandbox-only connection failure.
- Port 8081 in use: stop the other development instance deliberately; do not kill unrelated processes.
- Migration/schema error: capture the first relevant cause and use the migration runbook; do not reset the database or disable Flyway/validation.

Do not log environment dumps or complete private launch configuration when collecting diagnostics. Cloudinary credentials are not needed to prove normal backend startup or public business-directory reads.
