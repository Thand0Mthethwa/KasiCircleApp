# KasiCircle MVP sprint progress

Current evidence is in the [59-requirement feature matrix](MVP_FEATURE_VERIFICATION.md); release gates are in [release readiness](RELEASE_READINESS.md). The following checkpoint supersedes older completion claims and distinguishes local verification from hosted CI.

| Sprint | Status | Current evidence / remaining work |
|---|---|---|
| 1–4 foundation | COMPLETE (preserved) | Existing authentication/profile/business/image features retained. Current backend full suite passes; frontend and browser checks exercise the integrated foundation. |
| 5.4.7.6 reviews | COMPLETE | Submission/validation/duplicate/self/author denial, computed rating refresh and UI are implemented. Backend/component and real desktop/mobile review journeys pass. |
| 6 workers | COMPLETE | Profile/skills/categories, ownership/privacy, directory/filter/detail. Missing UI pagination fixed in `c1cb64d`; Workers targeted 4 passed; real desktop/mobile profile/discovery journeys pass. |
| 7 jobs | COMPLETE | Job lifecycle, owner permissions, discovery/detail, private applications and employer decisions. Desktop/mobile journeys pass with denial checks. Job save retry fixed in `47f27d8` with regression coverage. |
| 8 messaging | COMPLETE | Persisted conversations/messages, participant authorization, history/send/UI and contact links. Desktop/mobile exchange/reload and outsider-denial checks pass. |
| 9 notifications | COMPLETE | Recipient persistence/list/unread/read, activity hooks and UI navigation. Desktop/mobile decision-notification navigation and recipient denial pass. |
| 10 moderation | COMPLETE | Reports and admin queue/disposition UI with backend role checks. Desktop/mobile real admin JWT and regular-user denial pass. ACTIONED does not automatically hide targets. |
| 11 UI/UX | COMPLETE | Shared responsive/form/navigation states plus worker pagination and job retry. Desktop/mobile core journeys pass. Full component rerun includes updated navigation timing; final count pending below. |
| 12 production readiness | BLOCKED (hosted CI) | Code/config/dependency audit, local tests/build, fresh PostgreSQL 18 V1–V11 and repeat startup verified. CI targets PostgreSQL 16 and includes integrated browsers, but has not executed remotely because automatic pushing is prohibited. |
| 13 end-to-end QA | COMPLETE | Eight Playwright cases passed: four real browser/API/PostgreSQL/JWT journeys each on desktop and mobile Chromium. Privacy/ownership/participant/recipient/admin denials included. |
| 14 documentation | COMPLETE (local review) | API, architecture, setup, deployment/operations, migration safety, QA, limitations and release report written. 31 local links resolve, 96 unique feature-evidence paths exist, CI YAML parses, whitespace check passes. Final test-result fields are reconciled at the final checkpoint. |

## Executed checks — 2026-11-12

- Java 21 `mvn --batch-mode verify`: **241 passed**, zero failures/errors/skips, executable package success. Initial sandbox run failed due to Mockito attachment restrictions and is not counted as a pass.
- Sequential frontend suite after dependency/UI changes: **194 passed across 32 files**. The restored public-job route regression adds one case alongside the preserved pre-existing worker-route test; the final full rerun is pending at this draft checkpoint.
- ESLint and frontend production build pass after dependency updates.
- `npm audit --json`: **0 known vulnerabilities**. Updated Vite, React plugin, Vitest/coverage and React Router; Node 22.12+ now required. One Home test was updated to await asynchronous navigation.
- Packaged application applied **V1–V11** to an isolated local PostgreSQL 18 database; queried Flyway history confirmed all successful. Repeated browser-harness starts validated the migrated database.
- Playwright: **8 passed**, four journeys each on desktop/mobile. Initial assertion-text mismatches were corrected; a run interrupted by dependency installation is excluded from passing evidence. Only the completed final eight-case run is counted.
- Workflow YAML parsed; **31 local documentation links** resolve and **96 unique matrix evidence paths** exist. `git diff --check` passes. GitHub Actions itself has not run.

## Local commits

| Commit | Checkpoint |
|---|---|
| `c1cb64d` | Independent scope reconciliation and worker pagination; four focused worker tests pass. |
| `47f27d8` | Job form preserves input and supports retry after failed save; backend authorization unaffected. |

Further focused QA/dependency/CI and documentation commits are recorded at final handoff. No push, merge or deployment has occurred.

## Preserved previous checkpoints

Earlier foundation/Phase 4 results were 181 backend / 134 frontend; these did not prove complete marketplace scope. Subsequent completed commits include `26a9d8f` messaging, `10b662e` notifications, `7d18430` moderation and `5acc50c` UI. Production hardening was already committed as `fc73dd6` before this session; older statements that it was pending were stale.

Prior reconciliation recorded approved restoration of zero-byte Worker/Job files. This session did not restore or discard source. Starting edits in `backend/MIGRATIONS.md`, `frontend/src/services/api.js` and `frontend/src/services/api.test.js`, plus the untracked backend workspace file, are preserved and excluded from new commits. The related pre-existing App worker-route test was retained and extended to preserve public-job regression coverage; that reviewed test file is included in the QA commit.

## Resume point

**First unresolved gate: Sprint 12 hosted CI.** An authorized operator must publish/review the local commits and execute GitHub Actions. Follow the deployment guide for production configuration, historical-data migration/restore rehearsal and live Cloudinary upload/delete acceptance. No production infrastructure or cloud credentials were changed. Keep the documented MVP limitations explicit and do not restart completed implementation or declare unconditional release readiness.
