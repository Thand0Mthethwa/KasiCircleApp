# KasiCircle MVP Sprint Progress

Feature-level evidence is maintained in [MVP_FEATURE_VERIFICATION.md](./MVP_FEATURE_VERIFICATION.md). Earlier checkpoint results are distinguished from tests run against the current worktree.

| Sprint | Status | Verified progress |
|---|---|---|
| Sprints 1–4 | COMPLETE (previous checkpoint) | Authentication/profile/business foundations and Phase 4; recorded backend 181 tests, frontend 134 tests, lint/build pass. |
| Sprint 5.4.7.6 — Customer Review Submission | COMPLETE (prior code/test evidence) | Review API, validation, duplicate/self-review denial, and customer UI/tests exist; earlier tests included in backend 181/frontend 134. Reverify at final QA. |
| Sprint 6 — Worker Marketplace | COMPLETE | Restored the user-approved zero-byte tracked Worker files; verified public GET security rules and `/workers`/`/workers/:id`, added worker profile navigation and API/route integration coverage. Backend: 13/13 targeted tests passed using `mvn -DforkCount=0 test -Dtest=WorkerProfileServiceTest,WorkerProfileControllerTest,WorkerProfileRepositoryTest`. Frontend: 24/24 targeted tests across 6 files and 2/2 new Worker API/route tests passed with single-worker Vitest. Targeted ESLint passed. |
| Sprint 7 — Job Marketplace | COMPLETE | Reconnected the public job directory/search/filter/pagination, job detail, create/edit/close, applicant and employer application flows, API client, routes, and GET authorization matchers. Backend: 20 tests passed via `mvn -DforkCount=0 test -Dtest='*Job*Test'`. Frontend: 13 job tests passed across 6 files with single-worker Vitest; targeted ESLint passed. |
| Sprint 8 — Messaging | COMPLETE | Implemented V9 conversation/message persistence, authenticated conversation create/list, participant-only message history/send APIs, display-name-only DTOs, paging, Messages UI, secure worker/job contact links, API docs, and backend/frontend coverage. Backend: 10 tests passed with `mvn -DforkCount=0 test -Dtest=ConversationServiceTest,ConversationControllerTest`. Frontend: 14 tests passed across 5 files; targeted ESLint and `npm run build` passed. |
| Sprint 9 — Notifications | COMPLETE | V10 persistence, recipient-scoped list/unread/read APIs, application and message activity notifications, protected notification page, and resource navigation. Verified: 18 targeted backend tests, 5 focused notification frontend tests, targeted ESLint, and production frontend build. |
| Sprint 10 — Trust and Moderation | COMPLETE (committed `7d18430`) | V11 report persistence, authenticated submissions for business/worker/job/review content, target validation and duplicate-open protection, admin-only report queue/decisions with content summaries and notes, report forms, and moderation UI. Backend 7/7 tests and frontend 66/66 tests passed; targeted ESLint and production build passed. Admin decisions record disposition; content takedown is manual rather than automated. |
| Sprint 11 — UI/UX | COMPLETE (committed `5acc50c`) | Replaced mock Home workers/stats with real directory links; connected worker search and skill filters; widened main shell and bounded auth/onboarding layouts; improved focus, form error associations, navigation semantics, and keyboard operability. Browser-checked at 375px and 1440px. Full frontend suite: 192/192 tests in 32 files; ESLint and production build passed. |
| Sprint 12 — Production Readiness | PARTIAL (committed `fc73dd6`) | Removed DB/JWT insecure defaults, validated JWT key length and expiry, disabled SQL/security debug logs, limited Actuator to health, reviewed endpoint authorization and migrations, documented production config, added CI jobs for backend/frontend and PostgreSQL migration startup. `mvn --batch-mode verify` passed (241 backend tests and package); JWT config tests 3/3 passed. Workflow YAML parsed. CI itself and the PostgreSQL startup/migration check have not run; local DB credentials are unavailable and no push was made. |
| Sprint 13 — End-to-End QA | NOT STARTED | No browser E2E suite found. |
| Sprint 14 — Documentation and Release | NOT STARTED | Keep API docs current; architecture/deployment/limitations/release readiness documentation remains. |

## Current checkpoint

- Branch `Feature/Authentication`; Sprints 6–11 are committed locally, including Sprint 11 as `5acc50c`; nothing has been pushed.
- User approved restoring zero-byte tracked Worker/Job implementation, tests, and API docs from `HEAD`. Those restorations were limited to their named paths; other pre-existing nonempty edits remain untouched.
- The previous `4,065`-line deletion state no longer applies to restored tracked source. Remaining unrelated edits are preserved; see `git status` before staging.
- Sprint 8 adds persisted conversations/messages with participant authorization; no email or phone fields are returned. The messaging UI is reachable from worker and job profiles.
- Current results: Sprint 6 backend 13 tests and focused frontend tests passed; Sprint 7 backend 20 tests and frontend 13 job tests passed; Sprint 8 backend 10 tests and frontend 14 messaging/contact tests passed. Sprint 9 targeted backend 18 tests and frontend 5 focused notification tests passed; targeted ESLint and frontend production build passed. Full-suite tests/build remain for final QA.
- Sprint 10 backend: 7 tests passed; frontend moderation and marketplace regression coverage: 66 tests passed across 8 files; targeted ESLint and production build passed.
- Sprint 11 is committed and verified. Sprint 12 code and local checks are in progress; the pending CI/PostgreSQL runtime check cannot be verified without a push or local DB credentials.
- Current backend full suite: 241 tests passed. Current frontend full suite: 192 tests passed, with ESLint and production build passing. Sprint 13 E2E and Sprint 14 release documentation remain. No push or deployment has occurred.

## 2026-11-12 resumed verification

- Inspected source and test evidence again; preserved all pre-existing local edits.
- Corrected the feature matrix: worker directory pagination was incomplete because only the first 20 profiles were reachable. Added Previous/Next controls retaining filters and resetting to page zero on a new search. Targeted `Workers.test.jsx`: 4 passed. Full sequential frontend suite: 193 passed across 32 files (includes pagination regression).
- Full backend `mvn --batch-mode verify`: 241 passed, zero failures/errors/skips; package succeeded outside the sandbox. Initial sandbox run failed due to Mockito JVM attachment restrictions and is not counted as a pass.
- Initialized a disposable PostgreSQL 18 instance on port 55432, separate from existing databases; live migration/browser QA is in progress.
- New Playwright journeys are being added for customer reviews, workers/messaging, jobs/applications/notifications, and admin moderation on desktop/mobile. No E2E pass is claimed until execution finishes.

### Job form error-state checkpoint

The job form hid its entire form after a failed save. It now retains the entered details and permits retry; foreign-employer edit forms remain hidden. The new regression passes in the full 194-test frontend suite after patched dependency updates. Desktop/mobile live journeys: 8/8 passed. A restored public-job route test is being revalidated alongside the preserved pre-existing worker-route test.
