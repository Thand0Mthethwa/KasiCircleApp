# KasiCircle MVP Sprint Execution Plan

## Scope and source

The originally requested `SPRINT_EXECUTION_PLAN.md` and `SPRINT_PROGRESS.md` were not present in the repository at the verified checkpoint. This plan reconstructs only the remaining release work described in [KASICIRCLE_PROJECT_COMPLETION_AUDIT.md](../KASICIRCLE_PROJECT_COMPLETION_AUDIT.md). Completed authentication, profile, business management, reviews, directory ratings, and owner feedback work is not repeated.

## Completed MVP phases

- Phase 1: Backend ratings and reviews — complete.
- Phase 2: Frontend ratings and reviews — complete.
- Phase 3: Business discovery rating badges and owner feedback overview — complete.

## Remaining MVP sprints

### Sprint 4.1: Session recovery and release documentation

- Handle 401 responses from authenticated API requests by clearing the local session and notifying the application.
- Keep public API requests and failed unauthenticated login attempts from expiring an existing session.
- Redirect the application to its public welcome route after session expiry.
- Document business review endpoints and local/production setup.
- Maintain sprint progress tracking.

**Definition of done:** Focused frontend tests cover expiry, session cleanup, and non-authenticated requests; documentation matches implemented API behavior; changes are committed locally.

### Sprint 4.2: End-to-end verification and production packaging

- Run the complete backend and frontend test suites.
- Run frontend lint and production frontend build.
- Build the production backend JAR.
- Resolve failures caused by the MVP work and record exact verification results.

**Definition of done:** All required verification commands pass, progress is updated, and a focused local commit records the result. Do not push or deploy.
