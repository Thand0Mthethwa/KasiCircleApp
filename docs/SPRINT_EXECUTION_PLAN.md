# KasiCircle MVP sprint execution plan

This roadmap covers the complete requested marketplace MVP. Use the current [59-requirement feature matrix](MVP_FEATURE_VERIFICATION.md) and [release report](RELEASE_READINESS.md) for evidence. Preserve completed work and unrelated local edits. Do not push, merge or deploy automatically.

## Foundation — Sprints 1–4 and 5.4.7.6

Retain authentication/profile/password, business listings/discovery/images/ownership, and review submission/edit/delete/rating summaries. Verify authenticated customer submission, valid stars/comments, duplicate/self-review denial and rating refresh with controller/service/repository/component tests plus live journeys. Earlier 181/134 totals are historical; use current full-suite results.

## Sprint 6 — Worker marketplace

**Implemented and locally verified.** Profile create/edit, skills/categories, public directory/search/filter/detail and principal-owned WORKER-only management exist. Reconciliation identified missing UI access beyond the first 20 workers; pagination and a filter-reset regression test were added in `c1cb64d`. Public DTOs omit personal contacts. Retain worker controller/service/repository/UI and live browser coverage.

## Sprint 7 — Job marketplace

**Implemented and locally verified.** Create/edit/close/reopen jobs, owning-employer permissions, public directory/filter/detail, applicant-owned applications and employer application decisions exist. Retain self/duplicate/closed-job denial and applicant privacy checks. Job-form failures now preserve input and permit retry; unauthorized edit forms stay unavailable.

## Sprint 8 — Messaging

**Implemented and locally verified.** V9 persists unique one-to-one conversations and messages. Authenticated APIs enforce participant-only history/send, with connected UI and worker/job contact entry points. Browser QA verifies two-party send/history/reload and outsider denial. Delivery uses user refresh rather than realtime transport.

## Sprint 9 — Notifications

**Implemented and locally verified.** V10 persists recipient notifications. List/unread/read APIs derive recipients from authentication; application, employer-decision and message hooks generate activity. UI reads before navigation. Retain recipient-isolation and event-generation coverage.

## Sprint 10 — Trust and moderation

**Implemented and locally verified.** V11 persists reports for businesses/workers/jobs/reviews, validates targets/reasons/details, rejects duplicate open reports and supports administrator queue/decisions/notes. Backend role enforcement and real JWT browser tests reject unauthorized moderation. Dispositions do not hide targets automatically; that operational limitation is explicit.

## Sprint 11 — UI/UX

**Implemented and locally verified (195 component tests; eight browser cases).** Responsive shared shell/forms/navigation, real Home marketplace shortcuts, visible focus/labels, loading/error/empty states, worker pagination and job save retry are covered by component and desktop/mobile integrated journeys. No automated WCAG certification or physical-device coverage is claimed.

## Sprint 12 — Production readiness

**COMPLETE for the requested technical verification scope.** Hosted [CI run 43177804983](https://github.com/Thand0Mthethwa/KasiCircleApp/actions/runs/43177804983), attempt 1, completed successfully for original application SHA `81a257fd738657f7b98eccf30907a814cb4cc909` on `Feature/Authentication`. Both jobs and all required steps succeeded: Java 21 backend tests/package, PostgreSQL 16 migration/startup, locked frontend install and sequential tests, lint, production build and desktop/mobile browser journeys.

Required secret configuration, JWT validation, CORS, API authorization and migration checks remain implemented. Local PostgreSQL 18 results are historical supporting evidence; the hosted PostgreSQL 16 result is now independently verified. Production hosting, environment/TLS/secrets, monitoring, backup/restore rehearsal, live storage acceptance and release authorization remain separate operator requirements in the [release report](RELEASE_READINESS.md).

## Sprint 13 — End-to-end QA

**COMPLETE for defined core journeys.** Four Playwright journeys run sequentially on desktop and mobile Chromium (eight cases), against packaged Java 21 API, real JWT security, Flyway and PostgreSQL. Customer review/rating, worker/message, employer/applicant/notification and administrator/report flows pass with privacy/permission denial checks. Fixtures refuse non-loopback or non-QA database targets. See [QA](QA.md) for reproducibility and excluded external-service/cross-engine checks.

## Sprint 14 — Documentation

API reference, architecture, setup, deployment/operations, current migration guide, known limitations, QA instructions and release report are written. Local link/whitespace validation and final evidence reconciliation passed; documentation is complete and recorded in a focused local commit. Sprint 12's technical CI gate is now closed; keep production deployment authorization separate.

## Sprints 15 and 15.1 — preparation checkpoints

**COMPLETE.** Hosted CI preparation, stable navigation assertions, the tracked safe frontend environment example and accurate Apache 2.0 documentation are recorded in the earlier progress history. Owner confirmation of the intended license remains an approval record, not an automatically inferred decision.

## Sprint 16 — final technical MVP sign-off

**COMPLETE: 59/59 requirements COMPLETE**, recalculated from the actual matrix after closing its sole hosted-CI blocker. Evidence is [run 43177804983](https://github.com/Thand0Mthethwa/KasiCircleApp/actions/runs/43177804983), attempt 1, original SHA `81a257fd738657f7b98eccf30907a814cb4cc909`. GitHub CLI confirmed completed/success, successful frontend/backend jobs and required migration/startup/browser steps. Hosted log summaries show 241 backend, 195 frontend and 8 browser tests passed.

The new documentation commit only records that immutable application evidence. It is not claimed to have its own successful CI run, and it does not authorize or perform production deployment.

## Resume policy

Proceed to owner/operator decisions for production hosting, environment configuration, monitoring/support, backups/restore and migration rehearsal, live Cloudinary acceptance, license confirmation and explicit release authorization. Use the [release report](RELEASE_READINESS.md) and [deployment runbook](DEPLOYMENT.md). Do not restart completed marketplace sprints, reuse an older run for changed application code, or equate technical completion with a deployed application. Do not push, merge, dispatch or deploy automatically.
