# KasiCircle MVP Sprint Execution Plan

## Scope

This roadmap expands the previously completed foundation and the full marketplace scope specified in the current Master Development Prompt. Feature status and exact worktree discrepancies are maintained in [MVP_FEATURE_VERIFICATION.md](./MVP_FEATURE_VERIFICATION.md). Do not infer completion from an older audit alone. Existing work is preserved; do not push, merge, or deploy.

## Completed foundation (preserve)

- Sprint 1: Authentication and security foundation.
- Sprint 2: User profile and password management.
- Sprint 3: Business listings, directory, ownership, and image management.
- Sprint 4: Stabilization, session recovery, release docs, and original Phase 4 package verification. The recorded 181 backend / 134 frontend results predate marketplace sprints.
- Sprint 5.4.7.6: Customer review submission, moderation by authors, and rating summaries; source and tests exist. Reverify as part of final integration.

## Marketplace and release sprints

### Sprint 6 — Worker Marketplace

- Restore/reconcile the committed implementation against the current zero-byte worktree files only after the unexpected deletion diff is clarified.
- Worker profile create/edit; skills and service categories.
- Public directory, search/filter, profile details, ownership/privacy/security.
- Run backend and frontend worker suites, lint, and build.

**Exit:** no zero-byte Worker implementation/tests; authenticated users can only change their own Worker profile; public DTOs omit contact data; verified APIs and tests.

### Sprint 7 — Job Marketplace

- Job create/edit/close, public search/detail, employer ownership.
- Apply to jobs, applicant-owned application view, employer-owned application management.
- Ensure closed/self/duplicate applications are rejected and applicant email/phone are withheld.
- Verify backend/frontend tests, lint, and build.

**Exit:** employer and applicant authorization tests pass; public listing/detail and complete application workflows pass.

### Sprint 8 — Messaging

- Persist secure conversations and messages with an incremental Flyway migration.
- Create/list conversations; send and retrieve paginated/history messages.
- Enforce participant-only access in backend services/controllers; do not return unnecessary contact data.
- Build connected messaging UI and API integration; add backend and frontend tests.

**Exit:** cross-participant access is denied; history and send flows work; migration, tests, lint, and build pass.

### Sprint 9 — Notifications

- Persist notifications and unread counts; mark notifications read.
- Generate notifications for relevant marketplace activity.
- Add notification list/count UI, navigation, API integration, and tests.

**Exit:** notification persistence and permissions are verified; relevant activity links navigate to the correct resource.

### Sprint 10 — Trust and Moderation

- Support reports for inappropriate listings or content.
- Add appropriately restricted moderation workflows and administrator actions.
- Enforce admin-only actions on the backend, protect reporter data, and test authorization/validation.

**Exit:** unauthorized moderation attempts are rejected and report lifecycle tests pass.

### Sprint 11 — UI/UX and accessibility

- Reconcile visual patterns, responsive layouts, accessible labels/keyboard behavior, and navigation.
- Verify loading, error, and empty states on all marketplace journeys.
- Add targeted automated UI tests and accessibility checks where supported.

**Exit:** key pages work at narrow/mobile and wider viewports; forms/navigation are accessible; all relevant states are covered.

### Sprint 12 — Production readiness

- Audit authentication, every API authorization rule, request validation, CORS, error responses, and sensitive data exposure.
- Review all migrations for safe incremental upgrade behavior.
- Remove unsafe production secret defaults; document environment configuration.
- Add automated CI checks for backend tests/package, frontend tests/lint/build.
- Document secure production deployment configuration.

**Exit:** security/permission regression tests and CI pass; no credentials are committed; migration and configuration checks pass.

### Sprint 13 — End-to-end QA

- Exercise customer, worker, employer, applicant, and administrator journeys against an integrated backend/frontend environment.
- Add browser automation if supported in the repository environment; otherwise record the tested manual integration matrix and the missing automation limitation.
- Include negative authorization/privacy cases.

**Exit:** complete core journeys and denial cases are recorded with reproducible results.

### Sprint 14 — Documentation and release readiness

- Complete API and architecture documentation, setup/deployment guide, known limitations, and release checklist.
- Re-run full backend/frontend tests, lint, production builds, CI, and E2E checks.
- Update the feature matrix and progress log from executed evidence.

**Exit:** all required MVP features are COMPLETE or explicitly BLOCKED with evidence and decision; local release commits are focused. No automatic push/deployment.
