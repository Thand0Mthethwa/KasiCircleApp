# Frontend design migration

Reference: `/home/tsmthethwa/Downloads/KasiCircle-Explore-Source/KasiCircle-Explore` (the requested Projects reference directory is absent). Source reference remains read-only throughout this migration. Branch: `Feature/Authentication`; initial Git status clean. Date: 2026-11-13.

## Baseline and contract audit

- Baseline sequential frontend suite: **37 files / 226 tests passed**, `npm test -- --maxWorkers=1` (318.58s; captured in `/tmp/kasi-baseline-verified.log`). Initial sandbox attempts also completed; process startup was slow. Existing jsdom navigation diagnostics do not fail tests.
- Baseline `npm run lint`: passed. Baseline `npm run build`: passed (10.10s).
- Router remains BrowserRouter and existing App routes/guards. AuthContext retains JWT persistence, current-user refresh, auto-login after registration and unauthorized event handling. API module and backend contracts stay intact.
- Inspected reference App, main, styles, Explore, OtherPages, Navigation, BusinessCard, businesses, useSaved, package and assets. Reuse authoritative plum/cream/gold tokens, Fontsource typography, four-square mark, hero/search/category/card dimensions and breakpoints. Do not import mock records, local saved store, HashRouter or placeholder account pages.
- DTO audit: paged lists use `content`, `totalPages`, `totalElements`. Business cards consume `id`, `name`, `category`, `city`, `province`, `coverImageUrl`, `averageRating`, `reviewCount`; images use `imageUrl` and `isCover`; reviews expose authorName/rating/comment and summary distribution. Workers expose displayName/headline/bio/skills/serviceCategories/location, without private contact fields. Jobs/applications retain employer/applicant IDs, enums and timestamps. Conversations use participantId/name; messages use senderId/name/content/createdAt. Notifications use resourceType/resourceId/readAt. Reports retain target, reason, status and moderation fields.

## Route preservation matrix

Endpoints below are relative to `/api`. Existing page tests are under `frontend/src/pages/<name>.test.jsx`; service tests, route guard tests, dialog focus tests and desktop/mobile Playwright journeys provide additional coverage.

| Page | Routes | Permissions | Existing functionality/actions/forms | Endpoints | New visual components | Behavior tests | Status |
|---|---|---|---|---|---|---|---|
| Onboarding | `/ → /onboarding` | Guest; signed-in redirects home | Continue, guest browsing | — | Editorial introduction, decorative photo | Landing; service/route tests | Frontend verified |
| Welcome | `/welcome` | Guest | Login, register, guest browsing | — | Editorial welcome, marigold actions | Landing; service/route tests | Frontend verified |
| Login | `/login` | Guest | Validation, JWT login, password visibility, redirects | POST /auth/login; GET /users/me | AuthLayout, inputs, buttons | Login; service/route tests | Frontend verified |
| Register | `/register` | Guest | Resident/business/worker choice, validation, register and auto-login | POST /auth/register; POST /auth/login; GET /users/me | Account choice cards, AuthLayout | Register; service/route tests | Frontend verified |
| Home | `/home` | Public | API preview, category filtering, business/city search, worker/job search, skill links | GET /businesses | Photo hero, search panel, category buttons, listing cards | Home; service/route tests | Frontend verified |
| Explore | `/explore; /businesses` | Public | URL filters, search, category, city, pagination, reset, retry, listing navigation | GET /businesses?page&size&search&category&city | Reference hero, overlapping search, categories, listing grid | Explore; service/route tests | Frontend verified |
| BusinessDetail | `/businesses/:id` | Public; signed-in non-owner review actions; owner controls | Gallery, contacts, messaging, review CRUD, review pagination/summary, reporting | GET /businesses/:id; /images; /reviews; /reviews/summary; /reviews/me; POST /reviews; PUT/DELETE /reviews/:reviewId; POST /reports | Detail columns, gallery, cards, review forms, dialogs | BusinessDetail; service/route tests | Frontend verified |
| BusinessProfile | `/business-profile` | Protected; BUSINESS owner | Create/edit business, validation, upload/delete images, cover choice, retries | GET /users/me/businesses; POST /businesses; PUT /businesses/:id; GET/POST /businesses/:id/images; DELETE /images/:imageId; PUT /images/:imageId/cover | Owner dashboard, field system, photo management, dialogs | BusinessProfile; service/route tests | Frontend verified |
| BusinessReviews | `/business-reviews` | Protected; BUSINESS owner | Review dashboard, aggregate distribution, paging, retry | GET /users/me/businesses; GET /businesses/:id/reviews; GET /businesses/:id/reviews/summary | Review dashboard, summary cards | BusinessReviews; service/route tests | Frontend verified |
| Workers | `/workers` | Public | Keyword, skill, category, city filters; pagination; reset; retry | GET /workers?page&size&search&skill&category&city | Filter panel, worker cards, badges | Workers; service/route tests | Frontend verified |
| WorkerDetail | `/workers/:id` | Public; authenticated contact/report | Skills, categories, city/province, message owner, report | GET /workers/:id; POST /reports | Detail cards, skills, contact actions | WorkerDetail; service/route tests | Frontend verified |
| WorkerProfile | `/worker-profile` | Protected; WORKER owner | Create/update headline, bio, skills, categories, city, province | GET/POST/PUT /workers/me | Owner form and guidance panel | WorkerProfile; service/route tests | Frontend verified |
| Jobs | `/jobs` | Public; signed-in creation/applications links | Keyword/category/city filters, pagination, reset, retry, job navigation | GET /jobs?page&size&search&category&city | Job cards, search panel, status badges | Jobs; service/route tests | Frontend verified |
| JobDetail | `/jobs/:id` | Public; signed-in applicants; employer management | Apply, employer applications, accept/reject, close/reopen, edit, message, report | GET /jobs/:id; PATCH /jobs/:id/status; GET/POST /jobs/:id/applications; PATCH /jobs/:id/applications/:applicationId; POST /reports | Detail columns, application cards, message form | JobDetail; service/route tests | Frontend verified |
| JobForm | `/jobs/new; /jobs/:id/edit` | Protected; edit restricted to employer | Create/edit fields, validation, saving state, retry without data loss | GET /jobs/:id; POST /jobs; PUT /jobs/:id | Editorial header, premium form panel | JobForm; service/route tests | Frontend verified |
| MyJobApplications | `/my-applications` | Protected | Applications, status, pagination, job navigation, retry | GET /jobs/me/applications | Application cards, status badges | MyJobApplications; service/route tests | Frontend verified |
| Profile | `/profile` | Protected | Edit personal details; email/account type read-only; role-specific management; logout | GET/PUT /users/me | Profile summary, personal details form | Profile; service/route tests | Frontend verified |
| Messages | `/messages` | Protected; conversation participants | Participant deep links, conversation selection, message pagination/send, timestamps, retry | GET/POST /conversations; GET/POST /conversations/:id/messages | Conversation rail, message bubbles, composer | Messages; service/route tests | Frontend verified |
| Notifications | `/notifications` | Protected | Unread count, mark read, resource navigation, pagination, retry | GET /notifications; GET /notifications/unread-count; PATCH /notifications/:id/read | Notification cards and unread accents | Notifications; service/route tests | Frontend verified |
| AdminReports | `/admin/reports` | Protected; ADMIN (frontend and backend) | Open report paging, decisions/notes, dismiss/remove, retry | GET /reports; PATCH /reports/:id/moderation | Moderation cards and decision forms | AdminReports; service/route tests | Frontend verified |
| NotFound | `*` | Public | Return home, browser back | — | Editorial error state | NotFound; service/route tests | Frontend verified |

## Phases and verification

- A: implemented. Shared shell/accessibility/dialog and service tests passed in the first migration suite; lint and production build passed. Initial migration suite overall: 224/226; remaining failures tracked below.
- B: implemented; shared lint/build passed; final behavior and browser verification recorded in the final QA section.
- C: implemented; shared lint/build passed; final behavior and browser verification recorded in the final QA section.
- D: implemented; shared lint/build passed; final behavior and browser verification recorded in the final QA section.
- E: implemented; shared lint/build passed; final behavior and browser verification recorded in the final QA section.
- F: implemented; shared lint/build passed; final behavior and browser verification recorded in the final QA section.
- G: implemented and verified through frontend tests, lint/build and UI browser journeys. Live backend acceptance remains pending environment configuration.

Each phase must have affected tests, lint/build and a local commit recorded. Final screenshots must include reference and actual Explore at 1440×900, 768×1024 and 375×812. A build alone is not visual sign-off.

## Reference gaps and asset provenance

The reference Saved page/bookmark behavior is a demo-only local-storage feature absent from the functional app. It is not presented as a live backend capability. All actual application routes remain available through the shell. The reference has six simplified categories; preserve every actual backend category rather than relabeling API values or dropping filters. Default location stays unfiltered rather than silently restricting API results to Daveyton.

The supplied storefront/kota/salon/hardware WebP photos and SVG are reused from the user's reference. Image creator, redistribution licence and model/property releases are not established by the supplied project: confirm before production publication. Storefront may be decorative; listing photos must come only from each business's real Cloudinary record. Fontsource 5.3.0 files are copied directly from the installed reference packages into `frontend/src/styles/fonts`, retaining their bundled OFL licences. An offline npm install lacked cached metadata; the network install approval timed out, so this equivalent self-hosted copy avoids adding registry dependencies. No deployment or push is authorized.

## Implementation notes

All pages now inherit the plum/cream shared shell, Bricolage headings, DM Sans fields, reference radii and marigold primary buttons. Route-specific classes and editorial headings extend that system through business dashboards, workers, jobs, account pages, conversations, notifications and moderation. Home's earlier sage stylesheet is no longer imported. Onboarding, welcome, authentication and 404 use the supplied decorative storefront photo. No application routes, authentication logic, API calls, backend files or migrations have been replaced.

Explore uses a namespaced copy of the exact supplied stylesheet. Adaptations: ten actual backend categories occupy two desktop rows and a mobile scroll strip; actual API filters remain `search/category/city`; default city remains empty; real API totals/paging and error/empty/retry states remain. Real listings have no demo bookmark action. Cards share one component across Home and Explore, use backend images/ratings and an honest missing-photo state, and navigate with real links.

Browser comparison first pass: reference and actual hero rectangles match exactly at all three requested viewports; body ink and heading fonts match; search panel position/width matches. Corrected a 1.5px desktop search height difference from inherited input line height. Browser QA identified and fixed a Home category grid overflow, and screenshot inspection identified and fixed collapsed brand squares. Final captures are in `docs/design-migration`; hero and search rectangles now match exactly at all requested viewport sizes, with no document overflow. All five source asset copies match byte for byte (`asset-verification.json`).

`frontend/playwright.visual.config.js` runs the existing `e2e/ui.spec.js` fixture journeys independently of PostgreSQL. It does not replace the real backend Playwright configuration or claim live API coverage. `docs/design-migration/compare.mjs` captures the reference and actual frontend separately; QA-prefixed comparison records/photos exist only inside this capture script.

## Verification record

- Current lint: `npm run lint`, passed without lint errors/warnings.
- Current production bundle: `npm run build`, passed (6.14s; 77.92 kB CSS, 390.19 kB JS before gzip).
- Existing UI browser journeys: 7/8 passed in the first full host run; the sole failure was the Home category overflow at 375px. After the fix, the entire 24-route 375px sweep passed (1.9m). The other three route sweeps (768, 1280, 1440px), mobile menu/scoped search, gallery/account/skip-link focus, reduced-motion loading/failure/retry and mobile review/deletion-dialog journeys all passed. This accounts for all 8 existing UI test cases.
- Reference comparison: captured and visually inspected desktop, tablet and mobile; inspected desktop auth, worker and messaging images. Review the [comparison gallery](design-migration/README.md). Actual/reference hero and search rectangles, body ink and heading family match; categories/navigation/card metadata intentionally reflect the complete functional app.
- Business-profile and moderation recheck: 33 tests passed. The first migration run had an obsolete button-role expectation after business navigation became a real link. That assertion now checks the link and retains its destination check. The asynchronous moderation test helper now awaits `act` to settle authentication/redirect; its administrator and denial assertions are unchanged. One earlier heavily concurrent run exceeded the existing business edit test timeout; the unchanged test passed in the recheck.
- Final complete sequential frontend suite: **37 files / 226 tests passed**, `npm test -- --maxWorkers=1` (253.58s).
- Final markup check (BusinessDetail/Home/Explore): **67 tests passed in 3 files** after replacing the last sage illustration with a neutral no-photo icon and using React 18-compatible lowercase `fetchpriority` markup.
- Real PostgreSQL/browser integration attempt: `npm run test:e2e -- --project=desktop` stopped at the existing safety guard: `Set E2E_DATABASE_URL to an isolated local PostgreSQL database named kasicircle_qa.` No database was created, reset or guessed. No live API success is claimed. The sandbox API probe could not connect and PostgreSQL probe had no response; host database health is not established by those sandbox failures. Follow the existing local-backend runbook and provide the isolated QA environment to finish live desktop/mobile journeys.

The complete live end-to-end acceptance criterion remains open until that existing isolated backend environment is configured. No source/API/authentication/backend rewrite, migrations, push, merge or deployment is part of this migration.

## Local phase commits

| Phase | Local commit | Scope |
|---|---|---|
| A | `92d466a` | Shared tokens, fonts, shell, navigation, inputs/buttons and source assets |
| B | `78219a9` | Home, Explore, business details, owner/review pages and shared listing cards |
| C | `cec2aeb` | Worker directory, detail and profile |
| D | `afaea25` | Jobs, detail, creation/edit and applications |
| E | `e63ed0b` | Authentication layout, onboarding/welcome and profile |
| F | `00ae44a` | Messaging and notifications |
| G | Final migration commit | Moderation, 404, responsive refinements, regression setup and screenshot/QA report |

Implementation phases were validated together through the shared system and sequential full suite; individual phase commits preserve review boundaries. Final visual corrections have additional affected-page checks and browser reruns. This record does not imply a separate live-backend run after every phase.

## Handoff and resume

Frontend implementation, unit/service/route regression checks, lint, production build, responsive UI journeys and reference screenshots are complete. The remaining acceptance item is the existing real-backend desktop/mobile journey suite. Resume that item after configuring `E2E_DATABASE_URL` for the already-required isolated local `kasicircle_qa` database, without resetting the user's working database. Then run `npm run test:e2e` with a supported local Chrome path if necessary. Cloudinary upload verification additionally requires the existing storage configuration; no upload success against the real provider is claimed here.

Local review servers used ports 5174 (app) and 5175 (isolated reference copy). Reference source code, App router, API module, auth context and backend remain unchanged. No push, deployment or merge was performed.
