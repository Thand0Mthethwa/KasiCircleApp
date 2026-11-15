# Local unified marketplace verification — 2026-11-15

**Status: NOT ACCEPTED for publication readiness.** Existing development business discovery/details fail because the application role lacks privileges on `public.business_reviews`. The earlier `business_images` privilege error is no longer reproducible. No application fix or database change was made.

Baseline: branch `Feature/Authentication`, HEAD `22d580af59ba021a18393fd64932a6f92503f21a`, initially clean working tree. This verification uses the owner's actual development database, not the isolated QA database. Earlier QA results are not evidence of successful development-database integration.

## Actual development connection and permissions

- Target verified with `current_database()`, `current_user` and `inet_server_port()`: **localhost:5432/kasicircle**, application role **thando_mthethwa**, PostgreSQL local cluster. Connection settings came from the existing ignored `backend/.env.local`. Values other than public connection identity were not printed.
- `public` schema `USAGE`: granted.
- `public.business_images`: owned by `postgres`; effective application-role **SELECT, INSERT, UPDATE and DELETE are all granted**. A read-only `SELECT count(*)` succeeds: **one image row**.
- `public.business_reviews`: owned by `postgres`; effective **SELECT, INSERT, UPDATE and DELETE are all missing**. The running backend logs `permission denied for table business_reviews` when mapping business ratings.
- Application role is neither a superuser nor a role administrator. `sudo -n -u postgres ...` could not authenticate noninteractively. No administrative password was requested in chat, no grant was attempted, and no ownership change was made.
- Existing Flyway history contains a baseline plus successful migrations V1–V11. Migrations were inspected, not edited or executed. The backend ran with Hibernate schema validation and a command-line-only `--spring.flyway.enabled=false` override.

## Minimum safe repair

No `business_images` grants are currently needed. For comparison, its directory/image read path requires `SELECT` and schema `USAGE`; image create/cover/delete workflows need its existing INSERT/UPDATE/DELETE privileges. IDs are UUIDs, so no sequence grant is required.

For the actual remaining failure, **SELECT on business_reviews is the minimum discovery/detail repair**. Restoring existing review create/edit/delete functionality additionally requires INSERT/UPDATE/DELETE on that same table. An administrator can apply the following narrow grant privately in a local terminal:

```bash
sudo -u postgres psql -X -h /var/run/postgresql -p 5432 -d kasicircle \
  -v ON_ERROR_STOP=1 \
  -c 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_reviews TO thando_mthethwa;'
```

This grants no database-wide, schema-wide, DDL, ownership or superuser privileges. It changes no records and no migration. Enter any required administrator password only at the terminal prompt. The grant was **not applied during this verification**. Recheck effective privileges and rerun business API/detail/card-image acceptance afterward; no restart should be required for a table ACL grant.

## Runtime and data protection

- Actual packaged Spring Boot backend started on **http://localhost:8081** using the existing development DB and JWT settings. Current backend source was not modified. Its first foreground tool session ended with SIGTERM after browser verification; it was restarted as a persistent local process for owner inspection.
- Current React/Vite frontend started on **http://localhost:5173** with its existing `.env.local` API target. Existing frontend on **127.0.0.1:5174** was preserved.
- The verification backend deliberately has Cloudinary variables absent from its process environment. Existing image URLs still load. Upload/delete acceptance is not included, and uploads are unavailable in this verification process. The private environment file is untouched. Flyway is disabled only for this process, not in application configuration.
- No QA setup, fixture creation, registration, password reset, ownership changes, migrations, cleanup or record mutations were run against development. Browser network interception rejected any non-GET/HEAD/OPTIONS request; **zero write attempts** occurred. Loading checks delayed then forwarded actual API requests. The worker error/retry check aborted a request then retried against the real API; it substituted no response payloads.
- Read-only repeatable-read snapshots of all **13 application-readable public tables** before and after verification have identical row counts and row-content digests. **Zero changed tables.** Digests and record contents were kept private. `business_reviews` could not be included because SELECT is missing. No write request or write SQL was sent to that table.
- Actual inventory: **15 users** (4 BUSINESS, 4 WORKER, 7 RESIDENT), **one business**, **one persisted cover image**, **zero worker profiles**. No accounts/profiles were added to increase coverage.

## Executed local checks

A standalone Chromium verification against the running development services completed **19 checks: 17 passed, 2 failed**. [Sanitized individual results](local-marketplace-verification/checks.json). The two failed checks are business discovery and actual business detail loading, both caused by the review-table permission error. A first exploratory script incorrectly expected guest redirects to `/login`; it was corrected to the existing `/welcome` contract and rerun, with both guest-route checks passing. No application behavior was changed to satisfy the script.

| Workflow | Actual local result |
|---|---|
| `GET /api/businesses` | **FAIL: HTTP 500**, `permission denied for table business_reviews`. The existing business cannot render as a card. |
| All view | Independent business error and actual worker empty state render correctly; populated business results remain blocked. |
| Businesses tab | Correct source selection/visibility; populated results blocked by HTTP 500. |
| Workers tab | **PASS**: HTTP 200, zero records, truthful empty state. Populated worker discovery is not verifiable with current data. |
| Keyword and township/city | **PASS**: existing business name/city sent to both APIs and persisted in URL. Nonmatching keyword/city returns actual HTTP 200 empty results from both directories. Matching business results remain blocked by the permission error; no positive worker match exists. |
| Business detail navigation | **FAIL**: actual existing business detail API is HTTP 500; its rendered route safely displays an error. Successful card-to-detail traversal remains blocked. |
| Worker detail navigation | **NOT VERIFIED**: no existing worker profile to navigate to. No synthetic profile was created. |
| Image metadata and cover | **PASS**: actual `/api/businesses/:id/images` returns HTTP 200 with the existing cover image selected; no metadata mutation. |
| Actual cover image retrieval | **PASS**: original persisted image URL decoded in Chromium with positive natural width. Rendering that cover inside a populated marketplace card/detail remains blocked by business HTTP 500, so full image-in-card acceptance is not claimed. |
| Independent pagination | **PASS**: actual out-of-range business/worker pages show truthful recovery controls, independent URL page parameters and source totals; changing worker page retains business page. **Normal multi-page next/previous traversal is not verifiable** with one business and zero workers. |
| Loading/empty/error/retry | **PASS**: both loading states, actual unmatched empty states, actual business SQL failure, controlled worker transport failure and real-response retry. |
| Mobile navigation | **PASS**: 375px menu opens, legacy Workers navigation works, menu closes after navigation, unified Workers view works, no document overflow. |
| Guest management protection | **PASS**: `/business-profile` and `/worker-profile` redirect to `/welcome`; both management GET APIs return HTTP 401 without authentication. |
| Signed-in BUSINESS/WORKER/RESIDENT management | **NOT VERIFIED LIVE**: no existing development test-account credential source was found/supplied. Source role guards inspected and dedicated mocked unit tests rerun; this does not prove authenticated development access. Business owner loading also depends on the same missing review-table permission. |

## Existing test-account setup audit

Reviewed `README.md`, `RUNNING.md`, `docs/QA.md`, real-backend acceptance documentation, environment-template keys, SQL migration files, browser fixture setup and backend test resources without displaying credential values. No documented reusable development test-account setup or existing local account credential file was found in those project sources.

`frontend/e2e/marketplace.spec.js` generates UUID-named accounts through registration and performs test-owned mutations. It targets the separately guarded QA database on port 55432 with backend port 18081. `frontend/.env.e2e.local` provides QA database/browser configuration, not development user logins. That suite was **not run against development**. Backend H2/mocked tests and UI fixture identities are not real development login credentials. No fixture password was tried against existing accounts and no signed-in identity was fabricated.

## Management regression tests and visual evidence

`npm test --prefix frontend -- --maxWorkers=1 --pool=threads src/components/AppShell.test.jsx src/pages/BusinessProfile.test.jsx src/pages/WorkerProfile.test.jsx`: **42 tests passed across 3 files**, exit 0, 51.01s. These verify account menu/management behavior with mocks; live authenticated checks remain explicitly unverified.

Manually reviewed [desktop All state](local-marketplace-verification/explore-desktop.png) at 1440px and [mobile Workers state](local-marketplace-verification/explore-mobile.png) at 375px. Plum/cream/marigold identity and navigation remain consistent. No horizontal overflow appeared. The desktop capture intentionally records the current business error beside a healthy empty worker section. The fixed bottom navigation appears at the viewport edge inside the tall mobile screenshot. These are local failure/empty-state evidence, not populated-marketplace visual acceptance.

## Changes and publication recommendation

Only this report, sanitized check results and two screenshots were added under `docs/`. Application code, environment files, credentials, database privileges, records, schema, ownership and Flyway migrations were not changed. Verification tools/private snapshots remain under `/tmp`; no secret-bearing artifact was copied into documentation.

**Hold publication acceptance.** The local application still cannot display its existing business because review-table privileges are missing. Apply the administrator grant and repeat matching business discovery, detail and image-in-card checks. Populated worker/details and normal pagination require suitable existing data; signed-in management checks require existing credentials. Neither earlier isolated QA nor passing mocked unit tests closes those local coverage gaps. No push, merge, deployment, new account, reset, or Sprint 17 work was performed. No local Git commit was created for this verification.
