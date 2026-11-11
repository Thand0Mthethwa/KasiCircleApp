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

**BLOCKED on hosted CI execution; local checks implemented and verified.** Required DB/JWT secrets, signing-key/expiry validation, exact-origin CORS, stateless authentication, owner/participant/recipient/admin authorization, disabled debug/SQL logs and hidden health details are in place. Frontend dependency advisories were remediated; audit reports zero vulnerabilities. V1–V11 applied on fresh PostgreSQL 18 and repeated packaged startups succeeded. CI now targets PostgreSQL 16 and runs backend verification, migrations/startup, desktop/mobile browser journeys and sequential frontend tests/lint/build. It has not executed remotely because automatic pushing is prohibited.

**Next:** an authorized operator publishes/reviews commits and runs hosted CI. Follow the deployment guide for historical-data migration rehearsal, production secrets, TLS and live Cloudinary acceptance. No ordinary local implementation task requires another permission decision.

## Sprint 13 — End-to-end QA

**COMPLETE for defined core journeys.** Four Playwright journeys run sequentially on desktop and mobile Chromium (eight cases), against packaged Java 21 API, real JWT security, Flyway and PostgreSQL. Customer review/rating, worker/message, employer/applicant/notification and administrator/report flows pass with privacy/permission denial checks. Fixtures refuse non-loopback or non-QA database targets. See [QA](QA.md) for reproducibility and excluded external-service/cross-engine checks.

## Sprint 14 — Documentation

API reference, architecture, setup, deployment/operations, current migration guide, known limitations, QA instructions and release report are written. Local link/whitespace validation and final evidence reconciliation passed; documentation is complete and recorded in a focused local commit. Keep Sprint 12's external gate explicit; do not declare an unconditional production release.

## Resume policy

Resume from hosted CI and production acceptance gates after final local checks. Do not restart implemented marketplace sprints or turn a local test pass into a deployment claim. Record exact executed results and local commit IDs in [progress](SPRINT_PROGRESS.md).
