# Reproducible marketplace QA

## Unit/component checks

```bash
cd backend
mvn --batch-mode verify
cd ../frontend
npm ci
npm test -- --maxWorkers=1 --no-file-parallelism
npm run lint
npm run build
```

Backend unit/repository/controller tests use H2 or mocks; they do not establish PostgreSQL migration behavior. Browser QA uses a real packaged backend, Flyway, Hibernate validation and PostgreSQL. Run Maven where JVM attachment for Mockito is allowed; sandbox attachment failures are environment failures, not passing tests.

## Isolated browser checks

Prerequisites: packaged backend JAR, Node/npm dependencies, `psql` on PATH, a reachable local PostgreSQL database **named `kasicircle_qa`**, and Chromium or Chrome. The database must be disposable; tests create synthetic users/listings and directly promote a synthetic QA user to ADMIN for the moderation journey. They never connect to `kasicircle` or a remote database. Nothing cleans or truncates existing databases automatically. Do not put real data in this QA database.

Provision the local QA database with an account allowed to run its migrations and update synthetic users. Set a PostgreSQL URI using your local credentials (URL-encode reserved password characters). Keep it out of Git/logs. For installed Chrome:

```bash
cd frontend
export E2E_DATABASE_URL='postgresql://qa_user:qa_password@127.0.0.1:5432/kasicircle_qa'
export E2E_CHROME_PATH=/usr/bin/google-chrome
npm run test:e2e
```

Alternatively install Playwright's Chromium with `npx playwright install chromium` and omit `E2E_CHROME_PATH`. On a fresh Linux CI image use `npx playwright install --with-deps chromium`. Playwright starts and stops the packaged API on 18081 and Vite on 5174; both ports must be free. It refuses to reuse a running server. The QA-only JWT key is not a production secret. The harness validates a loopback host and exact QA database name before starting.

Four journeys run sequentially at desktop and mobile sizes (eight browser cases):

| Journey | Integrated assertions |
|---|---|
| Customer | API registration, UI login/review submission, persisted rating/listing refresh, review update/delete, invalid/anonymous/self/duplicate/foreign-author denial |
| Worker/customer | UI profile creation, edited skills/categories discovery, public contact privacy, canonical conversation reuse, UI message history/send/reload, outsider read/send denial |
| Employer/applicant | UI job creation/discovery/application and employer acceptance, ownership/privacy/duplicate/self/closed-job denial, generated notification and UI mark-read/navigation, recipient isolation |
| Administrator/reporter | Report creation/duplicate denial, reporter identity omission, regular-user API/route denial, real admin JWT and UI decision, resolved-report conflict |

Failure screenshots/traces are written to ignored `frontend/test-results`; traces may contain session data and must not be committed or shared publicly. Fixtures use fresh UUID names on every run and leave synthetic records in the disposable database so reruns do not depend on cleanup. CI uses an ephemeral PostgreSQL service.

This suite does not upload to Cloudinary, run a WCAG conformance audit, exercise all browser engines, or perform load testing. Backend storage/image tests remain the automated evidence for image behavior; real cloud credentials and an operator smoke check are required for release acceptance of image uploads.
