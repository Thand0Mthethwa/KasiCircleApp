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

- The user authorized restoring zero-byte tracked Worker files from `HEAD`; those implementation and test files plus migration V7 have been restored. Current Worker integration was verified and committed separately.
- Worker profile create/edit; skills and service categories.
- Public directory, search/filter, profile details, ownership/privacy/security.
- Run backend and frontend worker suites, lint, and build.

**Exit:** no zero-byte Worker implementation/tests; authenticated users can only change their own Worker profile; public DTOs omit contact data; verified APIs and tests.

### Sprint 7 — Job Marketplace

- The committed backend/tests and migration V8 were restored from `HEAD` with user approval. The listing UI, route wiring, and authorization matchers have been reconnected; existing Job API methods were verified.
- Job create/edit/close, public search/detail, employer ownership; apply to jobs, applicant-owned application view, employer-owned application management.
- Ensure closed/self/duplicate applications are rejected and applicant contact data is withheld.
- Verified: 20 backend job tests passed; 13 targeted frontend job tests passed; targeted ESLint passed.

**Exit:** COMPLETE. Employer/applicant authorization, public listing/detail, and application workflows are implemented and covered by tests.

### Sprint 8 — Messaging

- Persist secure conversations and messages with an incremental Flyway migration.
- Create/list conversations; send and retrieve paginated/history messages.
- Enforce participant-only access in backend services/controllers; do not return unnecessary contact data.
- Build connected messaging UI and API integration; add backend and frontend tests.
- Integrate secure "Message worker" and "Message employer" entry points; use recipient IDs from existing public listing DTOs without revealing contact details.
- Verified: 10 backend tests passed; 14 frontend messaging/contact tests passed; targeted ESLint and frontend production build passed.

**Exit:** COMPLETE. Cross-participant access is denied; persisted conversation/history/send flows, participant-only APIs, UI, and public listing integration are covered.

### Sprint 9 — Notifications

- Implemented persistent notifications and unread counts with additive Flyway V10.
- Recipient-scoped list/count/read APIs derive identity from the authenticated principal; users cannot read another user's notification.
- Create notifications for incoming job applications, application decisions, and incoming messages.
- Implemented protected notification list/navigation and mark-read-before-navigation, with unread count displayed on the notification page.
- Verified: 18 targeted backend tests and 5 focused frontend notification tests passed; targeted ESLint and frontend production build passed.

**Exit:** COMPLETE. Notification persistence, recipient permissions, event generation, UI, navigation, unread counts, and tests are implemented.

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
