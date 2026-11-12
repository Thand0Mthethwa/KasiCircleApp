# KasiCircle MVP release readiness — 2026-11-12

**Local implementation and integrated QA are reconciled; production release remains pending hosted CI and deployment acceptance.** No push, merge or deployment was performed. Do not use historical audit totals as proof of the full marketplace scope.

Feature disposition: **58 COMPLETE / 1 BLOCKED**, with hosted CI execution blocked by the explicit no-push constraint. There are no remaining MISSING/PARTIAL implementation requirements in the reconciled matrix.

## Scope and delivered changes

The [feature matrix](MVP_FEATURE_VERIFICATION.md) maps all 59 requested requirements to current backend/frontend paths, API behavior, tests, gaps and next steps. Existing reviews, workers, jobs/applications, messaging, notifications and moderation were inspected and exercised rather than rewritten.

New work fixes worker-directory pagination and job-form retry after failed save, adds protected disposable-database browser QA for desktop/mobile, updates vulnerable frontend dependencies, extends CI with live PostgreSQL browser journeys, and completes API/architecture/setup/deployment/migration/limitations documentation. The upgraded toolchain requires Node 22.12+; React remains version 18.

## Executed evidence

| Check | Result |
|---|---|
| Java 21 backend `mvn --batch-mode verify` | 241 tests passed; no failures, errors or skips; executable JAR packaged. Run outside sandbox after initial Mockito attachment failure. |
| Frontend sequential component tests | 195 passed across 32 files with final patched dependencies and both public-route regressions. Targeted App route suite: 3 passed. |
| ESLint | Passed after dependency and UI changes. |
| Frontend production build | Passed with Vite 8 and patched React Router. |
| Dependency audit | `npm audit --json`: zero known vulnerabilities at execution time. |
| Fresh PostgreSQL 18 migrations | V1–V11 all applied successfully; queried Flyway history has success=true for all 11. Hibernate validation and packaged API startup succeeded. |
| Repeat PostgreSQL startup | Browser harness restarted successfully against the existing migrated QA database. |
| Real browser/API/PostgreSQL integration | 8/8 Playwright cases passed: four journeys each on Chromium desktop and mobile emulation; real JWT authorization and private-data denial assertions included. |
| Clean committed snapshot | 11 route/API tests passed across four files from `5b323af`, excluding preserved uncommitted API edits. |
| Workflow YAML | Parsed locally; hosted GitHub Actions run not performed. |
| Documentation links / whitespace | 32 local documentation links resolve; 96 unique feature-evidence paths exist; `git diff --check` passes. |

The browser journeys cover review submission and rating updates, worker profile creation/discovery, persisted messaging, job posting/application/employer acceptance, generated notifications/read navigation, report submission and admin disposition. They include anonymous, duplicate, self-action, foreign-owner, nonparticipant, nonrecipient and regular-user moderation denial. See [QA](QA.md) for commands and boundaries.

## Outstanding release gates

1. **Hosted CI is blocked by the no-push constraint.** The workflow now includes PostgreSQL 16 startup and browser checks. An authorized operator must publish/review these local commits and execute the workflow. Local PostgreSQL 18 results are not a hosted PostgreSQL 16 CI result.
2. Configure the actual production environment, HTTPS origins, secret manager, database backup/restore and migration rehearsal using [deployment](DEPLOYMENT.md). Nothing in this task changes hosted infrastructure.
3. Supply real Cloudinary credentials and smoke-test upload, cover selection and deletion for the target deployment. Backend image/storage automated tests passed; browser QA excludes external storage.
4. Accept the documented MVP limits, especially manual messaging refresh and moderation dispositions without automatic takedown. See [known limitations](KNOWN_LIMITATIONS.md).

Sprint 12 cannot be called fully verified while the hosted-CI gate is unresolved. No unknown-data upgrade, hosted deployment, cloud-storage smoke check, WCAG certification or load/security certification is claimed.

## Reproducible resume point

Start with the hosted CI acceptance gate, then production environment/storage smoke checks. Do not restart completed marketplace implementation or discard existing local edits. The sprint log records commit checkpoints; all new commits remain local. Pre-existing edits in the migration document, API tests and API client, plus the untracked workspace file, are preserved and excluded. The related pre-existing App worker-route test was retained and extended with the public-job check in the QA commit.


## Sprint 15 — hosted CI preparation (2026-11-12)

Hosted CI remains **BLOCKED / NOT RUN**. See [the exact hosted-CI runbook](HOSTED_CI_VERIFICATION.md) for repository prerequisites, operator-only publication/dispatch commands, exact-commit run selection, job/step verification, and evidence required before changing that status.

The workflow now adds manual dispatch, pins both jobs to Ubuntu 24.04, explicitly installs the PostgreSQL client used by browser fixtures, and sets backend/frontend timeouts to 25/15 minutes. The clean test run exposed an asynchronous Home navigation assertion; its two remaining immediate URL checks now wait for routing to finish. Java 21/Maven verification, the PostgreSQL 16 service, locked npm installs, sequential frontend tests, ESLint, production build and managed-Chromium journeys remain configured. Repository checks confirmed Actions enabled, all actions allowed, no SHA-pin mandate and read-only workflow permissions. No additional repository secrets are required; CI uses disposable test fixtures and does not deploy.

The current branch and GitHub default branch are `Feature/Authentication`. The latest four prior commits are `f901b80`, `5b323af`, `47f27d8`, `c1cb64d`; live remote inspection confirmed **18 unpublished commits** before the Sprint 15 commit, not only four. Review the complete unpublished chain before any authorized push. Existing unrelated edits remain excluded.

Current Sprint 15 execution results are maintained in the runbook; tests run from a clean committed-source archive so the preserved uncommitted API changes cannot mask CI failures. Local PostgreSQL 18 is distinct from the hosted PostgreSQL 16 service. No hosted success is inferred from local results.


Sprint 15 local preparation is **COMPLETE**: clean lockfile install (zero audit-reported vulnerabilities), Java 21 Maven verification **241 passed**, final sequential frontend suite **197 passed / 32 files**, ESLint, production build, actionlint/YAML/startup-shell checks, fresh PostgreSQL 18 packaged startup with **11 successful migrations**, and **8 managed-Chromium desktop/mobile journeys passed**. The initial clean frontend run had 196 passing / 1 failing navigation assertion; the corrected full rerun passed. The 197 clean-source total includes two existing API tests absent from the earlier 195-test dirty worktree. No production code or unrelated edits changed. The prepared workflow's Ubuntu 24.04/PostgreSQL 16 execution, including hosted package provisioning, is still **NOT RUN**; use the runbook to obtain actual hosted evidence.
