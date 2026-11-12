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
| 11 UI/UX | COMPLETE | Shared responsive/form/navigation states plus worker pagination and job retry. Desktop/mobile core journeys pass. Full component suite: 195 passed, including updated navigation timing and both public-route regressions. |
| 12 production readiness | BLOCKED (hosted CI) | Code/config/dependency audit, local tests/build, fresh PostgreSQL 18 V1–V11 and repeat startup verified. CI targets PostgreSQL 16 and includes integrated browsers, but has not executed remotely because automatic pushing is prohibited. |
| 13 end-to-end QA | COMPLETE | Eight Playwright cases passed: four real browser/API/PostgreSQL/JWT journeys each on desktop and mobile Chromium. Privacy/ownership/participant/recipient/admin denials included. |
| 14 documentation | COMPLETE (local review) | API, architecture, setup, deployment/operations, migration safety, QA, limitations and release report written. Previous checkpoint local links resolved, 96 unique feature-evidence paths exist, CI YAML parses, whitespace check passes. Final requirement disposition: 58 COMPLETE / 1 BLOCKED (hosted CI). |

## Executed checks — 2026-11-12

- Java 21 `mvn --batch-mode verify`: **241 passed**, zero failures/errors/skips, executable package success. Initial sandbox run failed due to Mockito attachment restrictions and is not counted as a pass.
- Sequential frontend suite after dependency/UI changes: **195 passed across 32 files**, including the restored public-job route regression alongside the preserved pre-existing worker-route test. Targeted App route suite: 3 passed.
- Clean committed snapshot `5b323af`: 11 route/API tests passed across four files, excluding preserved uncommitted API edits.
- ESLint and frontend production build pass after dependency updates.
- `npm audit --json`: **0 known vulnerabilities**. Updated Vite, React plugin, Vitest/coverage and React Router; Node 22.12+ now required. One Home test was updated to await asynchronous navigation.
- Packaged application applied **V1–V11** to an isolated local PostgreSQL 18 database; queried Flyway history confirmed all successful. Repeated browser-harness starts validated the migrated database.
- Playwright: **8 passed**, four journeys each on desktop/mobile. Initial assertion-text mismatches were corrected; a run interrupted by dependency installation is excluded from passing evidence. Only the completed final eight-case run is counted.
- Workflow YAML parsed; **32 local documentation links** resolve and **96 unique matrix evidence paths** exist. `git diff --check` passes. GitHub Actions itself has not run.

## Local commits

| Commit | Checkpoint |
|---|---|
| `c1cb64d` | Independent scope reconciliation and worker pagination; four focused worker tests pass. |
| `47f27d8` | Job form preserves input and supports retry after failed save; backend authorization unaffected. |
| `5b323af` | Desktop/mobile live marketplace QA, patched dependencies, CI integration and public-route regression coverage. |

The final documentation commit records the authoritative 59-requirement matrix, roadmap, release evidence and operational guides. No push, merge or deployment has occurred.

## Preserved previous checkpoints

Earlier foundation/Phase 4 results were 181 backend / 134 frontend; these did not prove complete marketplace scope. Subsequent completed commits include `26a9d8f` messaging, `10b662e` notifications, `7d18430` moderation and `5acc50c` UI. Production hardening was already committed as `fc73dd6` before this session; older statements that it was pending were stale.

Prior reconciliation recorded approved restoration of zero-byte Worker/Job files. This session did not restore or discard source. Starting edits in `backend/MIGRATIONS.md`, `frontend/src/services/api.js` and `frontend/src/services/api.test.js`, plus the untracked backend workspace file, are preserved and excluded from new commits. The related pre-existing App worker-route test was retained and extended to preserve public-job regression coverage; that reviewed test file is included in the QA commit.

## Resume point

**First unresolved gate: Sprint 12 hosted CI.** An authorized operator must publish/review the local commits and execute GitHub Actions. Follow the deployment guide for production configuration, historical-data migration/restore rehearsal and live Cloudinary upload/delete acceptance. No production infrastructure or cloud credentials were changed. Keep the documented MVP limitations explicit and do not restart completed implementation or declare unconditional release readiness.


## Sprint 15 — hosted CI preparation (2026-11-12)

Local preparation is **COMPLETE**; hosted CI stays **BLOCKED / NOT RUN**. Workflow fixes add `workflow_dispatch`, Ubuntu 24.04 runners, an explicit PostgreSQL client dependency for browser admin fixtures, and 25/15-minute job timeouts. Existing Java 21/Maven, PostgreSQL 16, reproducible frontend install, stable test workers, lint/build and browser steps remain intact. A clean-source frontend run found a Home navigation race; two URL assertions now wait for asynchronous routing. Actionlint and workflow/shell syntax validation pass. GitHub read-only settings checks confirmed Actions enabled and read-only token permissions; no extra repository secrets or settings changes are required by the definition.

See [hosted CI verification](HOSTED_CI_VERIFICATION.md) for the clean-checkout results and exact operator-only push/trigger/watch instructions. Branch/default branch: `Feature/Authentication`; live remote tip `8be31ae04bdce451293d1d7a9c749e208f0c3f30`; 18 commits ahead before this preparation commit. The latest four are `f901b80`, `5b323af`, `47f27d8`, `c1cb64d`. Review all unpublished ancestors before authorizing publication. No push, merge, dispatch or deployment has occurred.


Executed Sprint 15 results: clean `npm ci` passed with zero audit-reported vulnerabilities; backend **241 passed** and package succeeded; final clean frontend **197 passed across 32 files**; lint/build passed; actionlint/YAML/startup-shell checks passed; packaged startup applied **V1–V11 successfully** on fresh local PostgreSQL 18; managed Chromium desktop/mobile **8/8 passed**. The initial frontend run failed one navigation race (196/197 passing), which is fixed and covered by the final full rerun. Two preserved uncommitted API-test deletions explain the earlier worktree's 195 total. Local database stopped after QA. The final local preparation commit contains only workflow, the affected navigation test and release documents; unrelated files remain byte-for-byte unchanged. Hosted Ubuntu 24.04/PostgreSQL 16 execution remains unverified.
