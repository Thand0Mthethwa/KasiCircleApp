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
| A | Tokens, global styles, application shell, shared primitives, navigation | COMPLETE: shell/accessibility/session tests 13/13; production build passed. Duplicated page navigation removed; safe favicon/metadata added. |
| B | API-backed homepage, onboarding and welcome | Pending |
| C | Business directory/detail/owner/review dashboard | Pending |
| D | Worker directory/detail/editor | Pending |
| E | Job directory/detail/forms/applications | Pending |
| F | Login/register/account/profile | Pending |
| G | Messages/notifications/moderation/404 | Pending |
| H | Responsive/accessibility/browser QA and final verification | Pending |

## Acceptance criteria and test requirements

1. Preserve every audited route, API request/response handling, JWT redirects/logout, authorization and account-type checks. Keep meaningful existing tests; update selectors only for intentional accessible UI changes.
2. Run frontend tests with `npm test -- --maxWorkers=1 --no-file-parallelism`; baseline reported previously as 197 is not current verification. Re-run ESLint and production build at checkpoints and after final changes.
3. Add focused navigation/menu/keyboard tests, homepage real-data/error/empty tests and browser coverage of search, filters, responsive menus and protected account navigation.
4. Run existing integrated browser journeys against an isolated local `kasicircle_qa` PostgreSQL database only. The prior local application credential blocker is not permission to use/reset the user's normal database. Distinguish fixture-backed UI checks from real backend journeys.
5. Inspect actual renders at 375, 768, 1280 and 1440px: no horizontal overflow, usable forms/menus, visible focus, adequate contrast/touch targets, semantic headings/labels, reduced motion and loading/error behavior.
6. Final report includes pages/components, screenshots/browser evidence, fresh test/lint/build counts, phase commit hashes and honest remaining issues. No claim of deployment or new hosted CI success.

## Resume notes

Audit and Phase A complete. Initial measured frontend run: 195/195 (32 files), rather than the historical 197. Shell tests add five keyboard/navigation/account cases. Use host execution for Node/Vite: the restricted sandbox fails worker stream creation. An isolated temporary QA PostgreSQL cluster is running on loopback port 55432; its directory/port are recorded in `/tmp/kasicircle-redesign-qa-state.json`. Normal development database/settings are untouched. Unchanged backend packaged successfully for browser QA. Next: Phase B homepage/onboarding/welcome, then Phase C business marketplace. Record Phase A commit in the next phase update.
