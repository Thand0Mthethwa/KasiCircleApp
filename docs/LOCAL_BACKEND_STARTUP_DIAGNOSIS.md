# Local backend startup diagnosis — 2026-11-12

**Status: launch/configuration repair prepared; real local startup remains BLOCKED on the existing PostgreSQL account settings. Backend is not currently listening on 8081. Do not proceed to Sprint 17 on the strength of passing tests alone.**

## Reproduced application exception

Running `mvn spring-boot:run` from `backend` on the host produced:

```text
ApplicationContextException: Unable to start web server
Caused by: WebServerException: Unable to start embedded Tomcat
Caused by: UnsatisfiedDependencyException: Error creating bean with name 'jwtAuthenticationFilter'
Caused by: BeanCreationException: Error creating bean with name 'jwtService'
Caused by: PlaceholderResolutionException: Could not resolve placeholder 'JWT_SECRET' in value "${JWT_SECRET}" <-- "${jwt.secret}"
```

The original launching environment lacked DB_URL, DB_USERNAME, DB_PASSWORD and JWT_SECRET. The ignored VS Code launch entry supplied only Cloudinary settings and did not load a private environment file. A root `.env.example` contained placeholders, not usable database credentials. Spring Boot does not automatically load dotenv files. The reproduced immediate failure is missing JWT configuration, not evidence that PostgreSQL is down or that Flyway failed.

The initial sandbox-only attempt failed on a read-only Maven cache, and a sandbox PostgreSQL probe incorrectly appeared offline. Repeating the checks on the host avoided those execution restrictions and exposed the application exception above. The Maven/devtools process returned zero despite the application failure; successful process exit or Maven tests alone are insufficient startup evidence.

## Executed checks

| Check | Result |
|---|---|
| Java / Maven | Java 21.0.13.0.3 and Maven 3.9.12 installed; Java 21 compilation/test execution succeeded. |
| Entry point / dependencies | Existing Spring Boot `BackendApplication`, POM, JWT/filter wiring and optional Cloudinary configuration inspected. No application-code/dependency change required by the observed failure. |
| PostgreSQL service | Host PostgreSQL 18 main cluster online at 127.0.0.1:5432 and accepting connections. No service restart or database reset performed. |
| Database authentication/existence | Not verified. The OS user's matching database role does not exist; passwordless administrative access is unavailable. A read-only connection probe of the known local maintenance role confirmed that TCP authentication requires a password. No usable DB credentials were available, and no passwords were supplied or guessed. |
| Required environment | Ignored `backend/.env.local` created with owner-only permissions and a generated private JWT key. DB_URL is set to the safe local target; DB_USERNAME and DB_PASSWORD still need the existing account's values. Values are not printed. |
| Flyway V1–V11 | Scripts inspected and unchanged. No applied migration was edited; local history/runtime migration validation cannot be queried until authorized database access is configured. No Flyway failure was observed as the cause of the reproduced exception. |
| Backend tests | `mvn --batch-mode test`: 241 passed, zero failures/errors/skips; BUILD SUCCESS. These tests use the existing H2/mocked configuration, not the user's real PostgreSQL database. |
| Port 8081 | Free; no backend listener at verification time. |
| GET /actuator/health | Connection refused because the application is stopped. The existing security policy requires authentication once running; an anonymous 401 is not an UP result. |
| GET /api/businesses | Connection refused because the application is stopped; public API success is not claimed. |
| VS Code setup | Java debugger/Java extensions installed. Launch/task JSON, Bash syntax, required-value preflight and narrow ignore rules validated. An actual successful F5 session is not claimed. |

## Safe repair

- Root launch configuration reads `backend/.env.local` and runs a value-free preflight before launching the existing main class in the backend working directory.
- Run task loads the same private file. Test task is separate; the combined task tests first and then starts the persistent backend.
- A tracked backend environment example has only safe local defaults and empty credential/key fields. Narrow ignore exceptions publish only the safe launch/tasks/example; real environment files and other local VS Code settings remain ignored.
- Existing inline Cloudinary credentials were moved out of the launch file into the ignored private file without repeating their values. They were exposed during initial inspection and must be rotated with the provider; no rotation is claimed. Cloudinary is optional for startup and was not the reproduced root cause.
- Spring Security, Flyway and Hibernate `ddl-auto=validate` remain enabled. No database objects, data, roles or credentials were changed.

## Required resume step

Privately fill DB_URL, DB_USERNAME and DB_PASSWORD in `backend/.env.local` using the existing database settings, or provide only the local path of an already configured private file. Do not paste secrets into chat/logs. Then reply that configuration is ready so the remaining real-database verification can continue.

Resume with authorized database connectivity/existence and Flyway-history checks, a normal env-loaded Maven/VS Code launch, port 8081, an authenticated health result and a public API response. Keep the application running after successful launch. If a database repair would delete/reset data or modify applied migrations, stop for explicit approval.

[Local launch and secure setup instructions](../RUNNING.md) describe the normal terminal/F5 paths. No push, merge, deployment or Sprint 17 work is performed by this diagnosis.
