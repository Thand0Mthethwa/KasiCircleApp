# KasiCircle frontend redesign

## Scope and starting state

Started 2026-11-12 on `Feature/Authentication` at `9f94349727fcafa0bdad3f6439ea0756d1e56cff`, with a clean tracked working tree. Existing ignored private environment files and IDE settings are outside this task. Preserve React/Vite/JavaScript/React Router/Tailwind/Lucide, every existing route, API contract, account restriction and user data. No backend or portfolio edits, production data operations, push, merge or deployment.

Primary sources inspected: [portfolio app/page.tsx](https://github.com/Thand0Mthethwa/thando-portfolio/blob/main/app/page.tsx) (`KasiPreview`) and [app/globals.css](https://github.com/Thand0Mthethwa/thando-portfolio/blob/main/app/globals.css) (`.kasi-preview`, `.mock-nav`, `.mock-body`, `.mock-search`, `.mock-chips`, `.shop-art`). Only the KasiCircle preview informs this design; no surrounding personal branding or charcoal/blue portfolio theme. Shop illustrations are decorative/fallback artwork, never fictional marketplace records.

## Audited page inventory and integration boundaries

| Pages | Routes | Existing behavior to preserve |
|---|---|---|
| Onboarding, Welcome | `/`, `/onboarding`, `/welcome` | Root redirect, guest browsing, authenticated redirect to home |
| Login, Register | `/login`, `/register` | Email/JWT authentication, automatic login, validation, RESIDENT/WORKER/BUSINESS selection |
| Home | `/home` | Public homepage, personalized greeting, worker keyword/skill navigation, marketplace destinations |
| Explore | `/explore`, `/businesses` | Public paginated directory, keyword/category/city URL filters, ratings from list API |
| BusinessDetail | `/businesses/:id` | Public details/contact/gallery, Cloudinary URLs, lightbox, summary/distribution, own-review CRUD, owner review restriction, reporting |
| BusinessProfile, BusinessReviews | `/business-profile`, `/business-reviews` | Auth required; BUSINESS-only owner management, one listing/account, validation, uploads/cover/deletion, read-only owner feedback dashboard |
| Workers, WorkerDetail | `/workers`, `/workers/:id` | Public keyword/skill/category/city search, public skills/location, private contact details, secure messaging/reporting |
| WorkerProfile | `/worker-profile` | Auth required; WORKER-only creation/editing, comma-separated skill/category conversion |
| Jobs, JobDetail | `/jobs`, `/jobs/:id` | Public open-job search, protected applications, employer-only edit/status/applicant decisions, privacy/reporting/messaging |
| JobForm, MyJobApplications | `/jobs/new`, `/jobs/:id/edit`, `/my-applications` | Auth required; employer edit check, create/update/validation, current-user application pagination |
| Profile | `/profile` | Auth required; name updates only, immutable email/type, account-specific management, logout |
| Messages | `/messages` | Auth required; participant/conversation deep links, ordered/paged history, request race protection, send/refresh |
| Notifications | `/notifications` | Auth required; real unread count, mark read before resource navigation, pagination |
| AdminReports | `/admin/reports` | ADMIN route guard, protected moderation, safe report fields, notes/decisions/pagination |
| NotFound | `*` | Accessible recovery navigation |

Inspected shared components/CSS, all page implementations, `AuthContext`, the complete API service, component/service/route tests, Playwright journeys and CI configuration. API/auth logic stays in its existing layer. Audit findings: duplicated bottom navigation; inconsistent widths; obsolete KasiConnect labels; placeholder onboarding art and unsupported social-login/reset buttons; no unified desktop shell. Existing tests cover ownership, privacy, CRUD, uploads, validation, retries and navigation and must remain meaningful.

## Design system

- Canvas `#fbfcf5`, surface `#fffef8`, forest `#183d2d`, deep green `#264e36`, secondary `#31684b`, sage `#d8e8bf`, warm clay accents, olive-gray text and understated borders.
- Georgia/system serif editorial headings; local system sans-serif controls. No external font/image dependency for basic rendering.
- Shared spacing, restrained radii, subtle shadows, outlined pills, consistent Lucide icons, 44px touch controls, visible keyboard focus and reduced-motion support.
- One responsive shell with desktop marketplace navigation, compact mobile menu/bottom navigation, notification/message/account access, footer and skip link. Wide directories, readable detail/form columns, responsive grids, honest skeleton/error/empty states.
- Business photos come from existing API cover/gallery fields; illustration fallback explicitly indicates no photo. No fabricated businesses, ratings, verification, statistics or private worker/employer contact data.

## Implementation phases and progress

Each phase includes focused validation and a local commit; update this record before continuing.

| Phase | Scope | Status / validation |
|---|---|---|
| A | Tokens, global styles, application shell, shared primitives, navigation | COMPLETE (`7185633`): shell/accessibility/session tests 13/13; lint clean and production build passed. Duplicated page navigation removed; safe favicon/metadata added. |
| B | API-backed homepage, onboarding and welcome | COMPLETE (`2654a72`): homepage/landing tests 10/10, production build passed. Three search scopes preserve worker keyword/skill navigation; real business API preview has loading/error/retry/empty states. Chrome inspected at 375/1440px with an empty API fixture; no overflow. |
| C | Business directory/detail/owner/review dashboard | COMPLETE (`b19c4e6`): 107/107 business/dialog tests passed, lint clean and production build passed. Responsive listing/photo cards, detail sidebar, owner dashboard, review statistics, semantic landmarks, keyboard cover/gallery/delete focus. Removed unsupported verification claim. Chrome directory/detail checks at 375/1440px: no overflow/runtime errors (explicit QA fixtures). |
| D | Worker directory/detail/editor | COMPLETE (`e49a975`): worker/accessibility tests 18/18, lint clean, production build passed. Shared worker cards, compact filters, service-area/skill detail layout and owner editor; private contacts and WORKER guard preserved. Chrome 375/1440px checks on all three pages: no overflow/runtime errors (QA fixtures). |
| E | Job directory/detail/forms/applications | COMPLETE (`9fca852`): 15 directory/form/application/route tests passed; all five detail tests (including new in-flight submission guard) passed in a focused follow-up. Lint clean; build passed. New cards, retry/clear filters, employer/application panels, guidance and status badges. Chrome 375/1440px checks of four job pages: no overflow/runtime errors (QA fixtures). |
| F | Login/register/account/profile | COMPLETE (`aadb81a`): auth/register/profile/session tests 35/35, lint clean and build passed. Shared editorial auth layout, accurate email-only login, accessible account selectors, validation/password visibility, profile dashboard and immutable-field labels. Removed inactive social/reset buttons and obsolete KasiConnect branding. Existing browser login selector updated for the accurate label. Chrome 375/1440px auth/profile checks: no overflow/runtime errors (QA fixtures). |
| G | Messages/notifications/moderation/404 | COMPLETE (`7bd40f9`): 22/22 communication/reporting/guard/recovery tests passed, lint clean and production build passed. Responsive conversation list, private incoming/outgoing bubbles using the existing senderId field, unread cards, moderation queue, retry/refresh and 404 recovery. Chrome 375/1440px checks of all four screens: no overflow/runtime errors (QA fixtures). |
| H | Responsive/accessibility/browser QA and final verification | COMPLETE: full suite 224/224 (37 files), affected recheck 95/95, lint/build clean, all eight real API journeys and eight UI checks passed. 96 route/viewport checks at 375/768/1280/1440px, 48 screenshots, labels/headings/44px targets/focus/reduced-motion/retry checks. QA servers stopped; normal PostgreSQL/settings untouched. See final QA report. |

## Acceptance criteria and test requirements

1. Preserve every audited route, API request/response handling, JWT redirects/logout, authorization and account-type checks. Keep meaningful existing tests; update selectors only for intentional accessible UI changes.
2. Run frontend tests with `npm test -- --maxWorkers=1 --no-file-parallelism`; baseline reported previously as 197 is not current verification. Re-run ESLint and production build at checkpoints and after final changes.
3. Add focused navigation/menu/keyboard tests, homepage real-data/error/empty tests and browser coverage of search, filters, responsive menus and protected account navigation.
4. Run existing integrated browser journeys against an isolated local `kasicircle_qa` PostgreSQL database only. The prior local application credential blocker is not permission to use/reset the user's normal database. Distinguish fixture-backed UI checks from real backend journeys.
5. Inspect actual renders at 375, 768, 1280 and 1440px: no horizontal overflow, usable forms/menus, visible focus, adequate contrast/touch targets, semantic headings/labels, reduced motion and loading/error behavior.
6. Final report includes pages/components, screenshots/browser evidence, fresh test/lint/build counts, phase commit hashes and honest remaining issues. No claim of deployment or new hosted CI success.

## Completion and owner review

All phases A–H are complete. The final Phase H commit contains this completed record, cross-page polish, reproducible browser checks, artifact ignore rules and [the detailed QA report](FRONTEND_REDESIGN_QA.md). Phase commit references A–G appear above; the final commit is identifiable with `git log -1 -- docs/FRONTEND_REDESIGN_QA.md`.

The actual initial suite contained 195 tests; the final suite contains 224 (29 additional meaningful interaction/recovery cases). No existing test case was deleted. Existing API/auth/backend/migration/package contracts remain unchanged. The eight original real API journeys passed; after final touch refinements, all eight expanded UI checks and both affected real review journeys passed again. One-worker sequential settings were retained.

Final screenshot/log archive: `/tmp/kasicircle-redesign-final-evidence/` (48 screenshots plus logs and index). Generated repository browser artifacts stay ignored. The task-owned temporary QA cluster and local preview were stopped; the normal PostgreSQL service remains running. No production data was accessed or modified. No push, merge, workflow dispatch or deployment occurred.

Owner follow-up: review the local commits and screenshots, then authorize publication and a fresh hosted CI run for these commits. Normal local VS Code startup, live Cloudinary-provider upload/credential-rotation status and non-Chrome/physical-device checks remain outside the executed frontend verification. No further redesign implementation is pending.
