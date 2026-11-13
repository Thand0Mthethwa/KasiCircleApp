# Real backend integration acceptance — 2026-11-13

Status: **PASSED** for the real Spring Boot/PostgreSQL workflows below. This report distinguishes real API/browser execution from the earlier UI fixture tests. External Cloudinary upload/delete is outside the verified boundary.

## Isolation and audit

- Working tree was clean at audit start; prior frontend migration ends at `121f144`.
- Existing environment files were inspected without exposing their values. Backend configuration points at development database `kasicircle` on the existing loopback cluster. It was **not used** for test migrations, fixture writes, or cleanup.
- E2E database: **`kasicircle_qa`**, PostgreSQL 18 in a separate cluster bound to **127.0.0.1:55432**. Existing PostgreSQL on 5432 is left untouched. Cluster data and logs: ignored `backend/target/e2e-postgres`; credentials: ignored `frontend/.env.e2e.local`, mode 0600. Bootstrap password file was removed after initialization. No administrator access or existing database credentials were needed.
- Initialization refused existing cluster/environment paths, verified the selected port was free, initialized a fresh cluster, checked `current_database()` before creating the database, then rechecked the actual database name before adding its dedicated isolation marker. No development database was copied.
- `frontend/scripts/e2e-database.mjs` accepts only credentialed loopback PostgreSQL URLs whose database is exactly `kasicircle_qa`, without query/hash options. Before starting Spring Boot/Flyway or executing SQL fixtures, it checks actual database name, actual server port, and `e2e_guard.identity`. It pins libpq to loopback, disables inherited service/options overrides, and passes secrets through the process environment rather than command arguments. Errors omit raw connection URLs, credentials and psql stderr.
- Spring Boot receives both `DB_*` and `SPRING_DATASOURCE_*` values for the verified database and a fresh ephemeral JWT signing key. Flyway runs the existing application migrations and Hibernate validates the schema. Backend port: 18081. Dedicated frontend port: 5176; the already-running development frontend on 5174 is preserved. Cloudinary credentials are deliberately absent from this isolated run.

## What the test suite writes and deletes

The original four marketplace journeys register UUID-named fixture users, create businesses/reviews/worker profiles/jobs/applications/conversations/messages/notifications/reports, update profiles and application/job/report states, delete **the review created by the test**, and promote a generated fixture account to ADMIN using SQL. There are no global DROP/TRUNCATE operations or blanket cleanup hooks. Other fixture records remain in the isolated database. The SQL promotion now repeats the database identity check and no longer places a credentialed URL in psql's arguments.

Additional real-API cases cover registration/validation/logout/protected routes and business creation/edit/filtering/image metadata and gallery rendering. Image rows are explicit controlled SQL fixtures in the isolated database, pointing at the supplied locally served photo. API responses and persistence are real. No network/API request interception is used in these marketplace cases. This validates database-backed image retrieval/display, not Cloudinary upload/delete against the user's provider account.

## Validation record

- Backend final `mvn --batch-mode test package`: **242 tests**, zero failures/errors/skips; BUILD SUCCESS (1m52s). The initial sandbox attempt failed because Mockito could not attach; the normal host rerun passed. These backend unit/service tests use the existing H2 test profile; PostgreSQL is separately exercised by real browser tests.
- Frontend final `npm test -- --maxWorkers=1`: **237 tests across 38 files passed** (246.50s), including 11 new isolation-guard tests. First sandbox attempt passed 225 tests but lost one worker at startup; it is not recorded as a complete pass.
- Final ESLint, including explicit lint of the `.mjs` helpers: **passed without warnings**. Production `npm run build`: **passed** (10.18s); application JS/CSS output is unchanged because no frontend application code changed.
- Final real desktop/mobile browser run: **14/14 passed in 3.7m**, using `npx playwright test --project=desktop --project=mobile`. All 16 optional worker-filter combinations and count pagination were exercised in each browser project. No API responses were mocked or intercepted.

## Visual review

Reviewed the existing reference and migrated desktop, tablet and mobile captures in `docs/design-migration`, plus the recorded geometry. The plum/cream palette, Bricolage headings, DM Sans typography, photographic hero, rounded inputs, marigold accents and card system remain consistent. Hero/search rectangles match the reference at the three requested viewport sizes. The mobile hero photo is hidden as in the source. Ten real backend categories occupy two desktop rows and a horizontal mobile strip rather than the demo's six categories. Actual account/worker/job/message navigation, review counts, listing actions, totals/pagination and the lack of a demo Saved destination are intentional differences.

An older desktop viewport artifact omits the brand squares. Fresh real-backend captures show all four squares; automated geometry checks passed at 1440, 768 and 375 CSS pixels, along with no-overflow and decoded-visible-image assertions. Long tablet search placeholders are clipped within their input widths; their labels and input controls remain available. Earlier screenshot listings are explicitly QA comparison fixtures, not proof of live integration.

## Safe restart

For first-time setup after building the backend, `cd frontend && npm run test:e2e:setup` creates a fresh dedicated cluster without administrator access. It refuses to overwrite an existing cluster/environment file or an occupied port. `npm run test:e2e:status` performs read-only verification while the cluster is running.

The local credential file is loaded automatically by the real Playwright configuration. Do not copy it into Git or chat. The cluster is disposable, stored beneath Maven's ignored target directory; stop it before `mvn clean`. To restart an already-initialized cluster locally:

```sh
/usr/lib/postgresql/18/bin/pg_ctl -D backend/target/e2e-postgres/data \
  -l "$PWD/backend/target/e2e-postgres/server.log" \
  -o "-h 127.0.0.1 -p 55432 -k $PWD/backend/target/e2e-postgres/socket" -w start
node frontend/scripts/e2e-status.mjs
cd frontend
npm run test:e2e -- --project=desktop --project=mobile
```

Do not reuse these commands against the development cluster. If the marker/name/port check fails, investigate without disabling it or resetting an existing database. No pushes, merges, deployments or Sprint 17 work are authorized by this acceptance task.

## Integration defect found and fixed

The added real directory-navigation case exposed a pre-existing PostgreSQL compatibility defect in worker search: omitting filters (including the normal initial unfiltered directory load) produced HTTP 500, `SQLState 42883`, `function lower(bytea) does not exist`. The original marketplace case supplied every filter, and H2-based tests did not expose PostgreSQL's nullable parameter typing.

The fix is confined to `WorkerProfileRepository`: explicitly cast each optional parameter to text in both the content query and count query. Null continues to mean “no filter”; endpoints, DTOs, permissions, database schema and migrations are unchanged. A repository regression checks all 16 optional-filter combinations with one-row pagination. Real PostgreSQL browser acceptance checks the same combinations with a full one-row page, forcing the count query, before exercising worker/job search and responsive menu navigation. The rebuilt backend's full suite passed **242 tests**, zero failures/errors/skips.

The old desktop screenshot's missing brand mark is a historical capture artifact: the live business screenshot shows all four squares. The fresh 1440/768/375px test captures explicitly verify their nonzero geometry, no document overflow and decoded visible images. The final real API search rerun and visual checks passed.

## Working and failing workflows

| Workflow | Actual backend evidence | Final result |
|---|---|---|
| Registration/login/logout | Browser registration, local phone normalization, auto-login, JWT `/users/me`, login and logout | Pass |
| Authentication/permissions | Guest protected-route redirect, wrong-password error, role/account checks, outsider API denials | Pass |
| Business marketplace | Owner UI creation/edit, real ID navigation, keyword/category/city filters and returned persisted values | Pass |
| Business details/images | Real image metadata API and gallery/lightbox rendering; visible image decoding checked | Pass with controlled DB image fixture; provider uploads not tested |
| Reviews | Browser submission, persisted rating aggregate, API update/delete and duplicate/self/invalid rejection | Pass |
| Workers | UI profile creation, API edit/read, UI keyword/skill/city discovery, all 16 filter combinations and count query | Pass after nullable-parameter fix |
| Jobs/applications | UI publishing/search/application/decision, API edit/close, duplicate and ownership/privacy rules | Pass |
| Messaging | API conversation creation, participant/outsider checks, browser receive/send/reload and persisted contents | Pass |
| Notifications | Real application notification, unread/read count, ownership check and browser resource navigation | Pass |
| Moderation | Unauthorized/regular-user denial, generated test-admin decision in UI and terminal-state protection | Pass |
| Responsive navigation/visuals | Desktop and mobile journeys; 1440×900, 768×1024 and 375×812 CSS viewport captures | Pass |

No covered application workflow remains failing. The worker SQL error was reproduced before the fix and passed afterward; it was not bypassed by changing filters or weakening assertions.

## Remaining boundaries and visible differences

- No positive Cloudinary provider upload/delete was performed, and no production storage credentials were loaded into the acceptance backend. Database image retrieval and frontend display/gallery are verified with controlled image rows. Provider connectivity/credentials remain a separate operational check.
- Real category count/navigation/account controls differ from the reference demo. Tablet uses the app's mobile navigation below 1024px to accommodate the complete route set. Long UUID fixture names wrap in cards and scroll within search inputs; they do not overflow the document. The reference's shorter sample names and three populated demo cards naturally create different card heights/content density.
- Real API result totals, review counts, management controls and error states replace the demo's Sample listings and Saved behavior. These are deliberate functional differences.
- Historical migration captures used request-intercepted comparison records; the new [real-backend gallery](backend-acceptance/README.md) uses actual API/database results. Mobile captures use device pixel ratio 3; their viewport sizes are stated in CSS pixels.
- The dedicated test cluster was stopped cleanly after acceptance, with its records retained. Existing PostgreSQL on 5432 was rechecked and remained accepting connections. The existing development frontend on 5174 was not stopped or reused. Playwright owns/stops its acceptance backend/frontend on 18081/5176.

## Files modified and commits

- `backend/src/main/java/com/kasicircle/backend/workers/repository/WorkerProfileRepository.java`: explicit nullable text parameter casts in both queries.
- `backend/src/test/java/com/kasicircle/backend/workers/repository/WorkerProfileRepositoryTest.java`: 16 optional-filter/count-pagination combinations.
- `frontend/playwright.config.js`: ignored environment loading, live database preflight, pinned JPA/Flyway targets, dedicated frontend port, ephemeral JWT and separate artifact directory.
- `frontend/e2e/marketplace.spec.js`: safe SQL promotion, registration/business/image/responsive/discovery cases and real PostgreSQL filter matrix; no mocked APIs.
- `frontend/scripts/e2e-database.mjs`, `e2e-status.mjs`, `setup-e2e-postgres.py`: guarded connection checks, sanitized status and non-admin fresh-cluster setup.
- `frontend/src/test/e2eDatabase.test.js`: isolation safety regression tests.
- `frontend/package.json`: setup/status commands; no dependency changes.
- This report, migration follow-up links, and `docs/backend-acceptance/`: sanitized evidence and actual browser captures.

Backend fix commit: **`32fc3d6`**. Acceptance harness/evidence are in the accompanying local acceptance commit reported in the final handoff. Earlier design migration commits are unchanged. Credentials and database files are ignored and uncommitted. Git is left clean after the acceptance commit. No push, merge, deployment or Sprint 17 work was performed.
