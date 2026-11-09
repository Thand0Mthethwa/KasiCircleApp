# KasiCircle Full MVP Sprint Execution Plan

This roadmap reconciles the requested marketplace scope with the evidence in [MVP_FEATURE_VERIFICATION.md](./MVP_FEATURE_VERIFICATION.md). Completed work is preserved and not repeated. Build changes incrementally, keep changes local, and update [SPRINT_PROGRESS.md](./SPRINT_PROGRESS.md) at every sprint checkpoint.

## Verified completed foundation

- Sprints 1–5: authentication, account/profile management, business listing/discovery/media management, and ratings/reviews are implemented.
- Sprint 5.4.7.6 customer review submission: verified complete with backend service/controller/repository tests and frontend interaction tests.
- The previously completed session-expiry handling and final package/test validation are recorded in progress.

## Remaining requested MVP sprints

### Sprint 6 — Worker marketplace

- Add a worker profile linked to a WORKER account, with validated editable bio/headline, skills/service categories, and location.
- Add owner-only profile creation/editing and safe public profile responses.
- Add a paginated public worker directory with keyword, skill/category, and location filters.
- Add directory and public worker-detail pages, routes, API integration, loading/error/empty states, and mobile/accessibility support.
- Test account-type restriction, ownership, validation, public field privacy, filtering, and frontend journeys.

**Done when:** database migration, API and UI are complete and tests cover permissions/privacy as well as normal behavior.

### Sprint 7 — Job marketplace

- Add job persistence and employer-owned create/edit/close operations.
- Add public search/filter, job detail, and job application.
- Add employer application review/management with strict applicant privacy.
- Test employer boundaries, unauthorized applications, validation, applicant privacy, and UI/API flows.

### Sprint 8 — Messaging

- Add persistent conversations/messages, participant authorization, send/receive, and ordered history.
- Add conversation UI with loading/empty/error states.
- Test participant-only access, nonparticipant denial, and message persistence.

### Sprint 9 — Notifications

- Add persistent in-app notifications, unread count, and mark-read operations.
- Emit notifications for relevant implemented activity (initially job application and messaging events).
- Add notification UI and navigation; test persistence, recipient isolation, count, and read state.

### Sprint 10 — Trust and moderation

- Add reporting for inappropriate businesses, worker profiles, jobs, reviews, and messages where supported.
- Add admin-only moderation actions enforced on backend routes/services.
- Protect reporter and moderation data; test user/admin authorization and state transitions.

### Sprint 11 — UI/UX and accessibility

- Review responsive behavior, accessibility, navigation, loading/error/empty states, and interaction consistency across all implemented flows.
- Replace obsolete home-page marketplace mock data and links with real API-backed routes.
- Add targeted component/accessibility coverage.

### Sprint 12 — production readiness

- Audit security configuration, authorization, validation, information exposure, and rate/size constraints.
- Verify migrations are incremental and safe for existing deployments.
- Add automated CI checks for backend tests/package, frontend tests/lint/build.
- Document secure environment configuration, CORS, secrets, and production deployment without deploying.

### Sprint 13 — end-to-end QA

- Add browser journeys for customer, worker, employer, and administrator workflows.
- Verify integrated API/database behavior and cross-account privacy boundaries.
- Fix regressions and record tested browser/environment versions.

### Sprint 14 — documentation and release readiness

- Complete API and architecture documentation, setup/deployment guide, known limitations, and release readiness report.
- Run the final test/build/security gates; document exact commands/results.
- Create focused local commits; do not push, merge, or deploy.

## Execution order

Work in numeric order starting at Sprint 6. Keep each sprint's backend, frontend, integration, and tests together where they form a coherent independently verified change. If a sprint exceeds a session, commit a verified vertical slice and record the precise next task in `SPRINT_PROGRESS.md`.
