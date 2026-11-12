# KasiCircle MVP release readiness — Sprint 16 (2026-11-12)

**Technical MVP verification is COMPLETE: 59/59 requirements COMPLETE. Production deployment is not approved or claimed by this report.** The final hosted-CI blocker is closed by an actual successful GitHub Actions run, not by local checks alone.

## Verified hosted evidence

- Repository: `Thand0Mthethwa/KasiCircleApp`; branch: `Feature/Authentication`; workflow: `CI` (`.github/workflows/ci.yml`).
- Run: [43177804983](https://github.com/Thand0Mthethwa/KasiCircleApp/actions/runs/43177804983); attempt **1**; event: `push`.
- Verified application SHA: `81a257fd738657f7b98eccf30907a814cb4cc909`.
- GitHub status: **completed**; conclusion: **success**. Verified read-only with GitHub CLI run, job/step and summary-log APIs on 2026-11-12.
- `frontend` job `131046186522`: **success**; locked install, **195 tests / 32 files**, ESLint and production build succeeded. Completed 2026-11-12 09:48:01 SAST (07:48:01 UTC).
- `backend` job `131046186863`: **success**; Java 21 Maven build/package with **241 tests, zero failures/errors/skips**, PostgreSQL 16 migration/startup checks, browser installation and **8 desktop/mobile browser journeys** succeeded. Completed 2026-11-12 09:49:24 SAST (07:49:24 UTC).
- Run metadata last updated 2026-11-12 09:49:25 SAST (07:49:25 UTC).

This evidence applies to the original application commit `81a257fd738657f7b98eccf30907a814cb4cc909`. The Sprint 16 documentation commit records that result; it does not claim that CI ran on the new documentation commit. No application functionality, workflow, dependency or database migration is changed by this sign-off. Later application/release-candidate changes require their own CI evidence. Technical completion is not production deployment approval, and no deployed application is claimed.

The source examined at the start of Sprint 16 was exactly the verified SHA. Both jobs and every required step reported completed/success; none of the required verification steps was skipped. The frontend, backend, PostgreSQL startup and desktop/mobile integration checks establish the requested technical MVP baseline. They do not establish a production environment or live external-storage acceptance.

## Requirement disposition

The actual feature matrix contains **59 requirement rows**, all **COMPLETE**: **59 COMPLETE / 0 BLOCKED / 0 PARTIAL / 0 MISSING**. Before this hosted run it contained 58 COMPLETE and one BLOCKED (Automated CI checks). See [the feature matrix](MVP_FEATURE_VERIFICATION.md) and [hosted CI evidence](HOSTED_CI_VERIFICATION.md).

## Production-release decisions and operational requirements

These operational conditions are distinct from the completed technical feature matrix. Their completion/approval is not established by the CI run.

| Area | Required owner/operator decision or action |
|---|---|
| Hosting and networking | Select production account/provider, region, API/SPA hosting, capacity and accountable operator. Configure DNS, HTTPS/TLS, API routing and SPA fallback. Confirm cost and availability expectations. |
| Environment and secrets | Provision production PostgreSQL and a secret manager; set DB/JWT/Cloudinary configuration and expiry. Build with the real public `VITE_API_BASE_URL` and exact CORS origin. Do not reuse CI credentials or place secrets in Vite variables. |
| Monitoring and support | Configure health/availability, error/latency and database/storage monitoring, alerts, log retention and incident ownership/on-call contact. Exclude credentials/tokens from logs. |
| Backups and recovery | Approve backup schedule, retention, access and recovery objectives for PostgreSQL and relevant storage assets. Demonstrate restore, rehearse migrations on a representative restored database and record rollback/recovery steps before rollout. Fresh CI database success is not an unknown-data production upgrade rehearsal. |
| Production acceptance | With authorized real credentials, smoke-test Cloudinary upload/cover/delete, provision administrators through an audited process, and exercise the deployed customer/worker/employer/admin journeys in the intended environment. No such deployment or smoke test is claimed here. |
| License and known limits | Record the owner's confirmation of the existing Apache 2.0 license and attribution requirements; this sign-off does not infer license approval from a Git push. Accept the documented messaging-refresh, manual moderation and other [known limitations](KNOWN_LIMITATIONS.md). |
| Release authorization | Identify the exact release artifact/SHA, named approver and deployment operator, rollout/rollback conditions and release window. Obtain explicit production-release authorization. A successful CI run is not authorization to push, merge or deploy. |

Use [deployment and operations](DEPLOYMENT.md) for implementation of these requirements. Remaining operational approvals do not reopen the completed technical MVP requirements unless they introduce new application scope or reveal a regression.

## Sign-off and scope

Sprint 16 records the verified run and closes the technical MVP. No new application test run is claimed for this documentation-only task; the hosted results above were independently read from GitHub. Documentation row counts, evidence consistency, links and Git whitespace/scope checks are validated locally before the focused documentation commit. This task performs no push, merge, workflow dispatch or deployment.

## Earlier local verification (historical)

The following table preserves the prior local evidence. In particular, an earlier statement that hosted CI had not run describes that checkpoint only and is superseded by Sprint 16 above; it is not the current release status. Historical local frontend totals differ from hosted totals as described in the sprint log.

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

## Earlier preparation history

The following Sprint 15/15.1 records describe the conditions at those earlier checkpoints, including then-blocked CI and unpublished commits. Their present-tense wording is historical; the verified Sprint 16 result above is authoritative for technical completion.

## Historical Sprint 15 — hosted CI preparation (2026-11-12)

Hosted CI remains **BLOCKED / NOT RUN**. See [the exact hosted-CI runbook](HOSTED_CI_VERIFICATION.md) for repository prerequisites, operator-only publication/dispatch commands, exact-commit run selection, job/step verification, and evidence required before changing that status.

The workflow now adds manual dispatch, pins both jobs to Ubuntu 24.04, explicitly installs the PostgreSQL client used by browser fixtures, and sets backend/frontend timeouts to 25/15 minutes. The clean test run exposed an asynchronous Home navigation assertion; its two remaining immediate URL checks now wait for routing to finish. Java 21/Maven verification, the PostgreSQL 16 service, locked npm installs, sequential frontend tests, ESLint, production build and managed-Chromium journeys remain configured. Repository checks confirmed Actions enabled, all actions allowed, no SHA-pin mandate and read-only workflow permissions. No additional repository secrets are required; CI uses disposable test fixtures and does not deploy.

The current branch and GitHub default branch are `Feature/Authentication`. The latest four prior commits are `f901b80`, `5b323af`, `47f27d8`, `c1cb64d`; live remote inspection confirmed **18 unpublished commits** before the Sprint 15 commit, not only four. Review the complete unpublished chain before any authorized push. Existing unrelated edits remain excluded.

Current Sprint 15 execution results are maintained in the runbook; tests run from a clean committed-source archive so the preserved uncommitted API changes cannot mask CI failures. Local PostgreSQL 18 is distinct from the hosted PostgreSQL 16 service. No hosted success is inferred from local results.


Sprint 15 local preparation is **COMPLETE**: clean lockfile install (zero audit-reported vulnerabilities), Java 21 Maven verification **241 passed**, final sequential frontend suite **197 passed / 32 files**, ESLint, production build, actionlint/YAML/startup-shell checks, fresh PostgreSQL 18 packaged startup with **11 successful migrations**, and **8 managed-Chromium desktop/mobile journeys passed**. The initial clean frontend run had 196 passing / 1 failing navigation assertion; the corrected full rerun passed. The 197 clean-source total includes two existing API tests absent from the earlier 195-test dirty worktree. No production code or unrelated edits changed. The prepared workflow's Ubuntu 24.04/PostgreSQL 16 execution, including hosted package provisioning, is still **NOT RUN**; use the runbook to obtain actual hosted evidence.


## Historical Sprint 15.1 — pre-push findings

The frontend example is prepared for publication with a narrowly scoped root ignore exception and only `VITE_API_BASE_URL=http://localhost:8081`. Both README setup sections use that example with the current Node prerequisite and locked installation. Actual environment files remain ignored. No application code is changed.

The complete `LICENSE` is Apache License 2.0 and remains unchanged. The root README now describes that file instead of claiming MIT. **The repository owner must approve Apache 2.0 as the intended project license before publication.** No other conflicting first-party license notice was found in the tracked source/documentation review; existing copyright and attribution notices were preserved. This correction does not determine ownership or grant a new license.

Local validation passed: `git diff --check`, exact staged-file review, narrow ignore-rule assertions, a public-setting allowlist and staged secret-pattern scan, unchanged license/unrelated-file hashes, documentation consistency, and a clean staged-snapshot copy/Vite environment-loading/production-build check. Build validation reused the previously installed locked dependencies; no application functionality or dependency manifest changed. These checks establish that the published frontend setup inputs exist, without claiming a new dependency-install or full application-test run. Hosted CI remains unverified and must succeed for the eventual published commit before its release gate is cleared. Nothing is pushed, merged, rebased or deployed by this task.
