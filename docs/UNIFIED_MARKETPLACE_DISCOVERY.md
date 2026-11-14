# Unified marketplace discovery — 2026-11-14

## Audit and preservation contract

Baseline: `457a41afa58edfc8283f15a180fa54b8a5ba132d`, `Feature/Authentication`, clean working tree. Reviewed the current plum/cream design and the existing discovery pages, public DTOs, cards, services, router, detail-page actions and unit/browser journeys.

| Existing entry | Existing behavior | Integration decision |
|---|---|---|
| `/home` | Business API preview, categories, business/city search, separate worker/job searches and skill shortcuts | Primary search discovers both provider types. Preserve business preview/categories and Jobs navigation. Worker skill shortcuts enter unified Workers view. |
| `/explore` | Business keyword/category/city filters, server paging, actual cover images/ratings, retry/reset | Default All view; shared keyword/city and explicit Businesses/Workers tabs; retain business filters in their own scope. |
| `/businesses` | Business discovery alias, query bookmarks | Business-first default, same shared page; original `search`, `city`, `category` meanings preserved. |
| `/workers` | Worker keyword/skill/category/city filters and paging | Keep the existing directory and bookmarks unchanged. |
| `/businesses/:id` | Public contacts/gallery, owner actions, customer review CRUD, reporting and messaging | Unchanged; business cards retain business IDs and this route. |
| `/workers/:id` | Public headline/bio/skills/service area; owner edit, authenticated messaging/reporting, privacy rules | Unchanged; worker cards retain worker-profile IDs and this route. |
| Account routes | BUSINESS management/reviews, WORKER profile, RESIDENT actions, JWT and admin guards | Unchanged; no account-type, ownership, registration or authorization changes. |

## API contracts and limitations

Reuse `businessService.getAllBusinesses` (`GET /api/businesses`) and `workerService.getWorkers` (`GET /api/workers`). Both return Spring pages with `content`, `totalElements`, `totalPages`; both accept `search`, `city`, `page`, `size`. Business `category` and worker `category`/`skill` remain independent domain filters. Business keyword search matches business names; worker keywords match names/headline/bio. Worker skill/category search uses its dedicated API parameters. City matching retains each API’s semantics: exact, case-insensitive business city; case-insensitive worker city substring. A partial city can therefore return workers without businesses. No geolocation or distance ranking is implied. No client-side filtering of partial server pages or fabricated keyword expansion is introduced.

All is segmented: business section followed by independent-worker section. Each has its own page index, total, loading/error/empty state and retry. No global ranking, merged page count or deduplication of people across domain records is implied. Public results may include the same person in two legitimate provider roles. A failing/slow service does not hide the healthy section. Results from superseded requests are ignored.

Query contract: `search`, `city`, `provider=all|businesses|workers`, legacy business `category`, worker-only `skill` and `workerCategory`, and independent 1-based `businessPage`/`workerPage`. `/explore` defaults to All; `/businesses` defaults to Businesses. Search/reset resets both page indices; a business category change resets only business pagination. Tabs retain committed criteria and independent pages. Browser history restores applied inputs and results. Reset clears search/source filters and page indices while retaining the selected provider view. `/workers` retains its original query contract.

Public presentation uses a whitelisted model and source-qualified keys (`business:<id>`, `worker:<id>`). Worker cards do not invent ratings, images, availability or verification and never display private account fields. The backend, API formats and schema need no changes.

## Implementation inventory

- `frontend/src/models/provider.js`: public-field presentation mapping and source-qualified IDs/keys.
- `frontend/src/hooks/useProviderResults.js`: independent request/loading/error/retry state, server metadata and stale-response cancellation.
- `frontend/src/components/ProviderCard.jsx`: existing business card plus public worker card and real detail links.
- `frontend/src/components/ProviderResults.jsx`: source headings/counts, independent states and pagination.
- `frontend/src/pages/Explore.jsx`, `frontend/src/styles/unified-marketplace.css`: shared URL-driven search, tabs, scoped filters and responsive plum/cream layout.
- `frontend/src/components/MarketplaceCards.jsx`, `HomeBusinessCard.jsx`: explicit Business labels using existing card presentation.
- `frontend/src/pages/Home.jsx`, `frontend/src/components/AppShell.jsx`: primary shared search and Explore navigation; Jobs and account menus remain accessible.
- `frontend/src/pages/UnifiedExplore.test.jsx`, `Explore.test.jsx`, `Home.test.jsx`, `frontend/src/components/AppShell.test.jsx`: new discovery coverage and updated customer-facing labels; role-specific management links checked for RESIDENT, BUSINESS and WORKER.
- `frontend/e2e/marketplace.spec.js`, `ui.spec.js`: real PostgreSQL-backed unified journey and existing responsive QA updated for the shared home search.

No backend services, schemas, authentication, registration, detail pages or management workflows were modified.

## Verification

- Full frontend: `npm test --prefix frontend -- --maxWorkers=1 --pool=threads` — **262/262 tests, 39/39 files passed**, exit 0 (249.94s). This includes 62 tests in the five affected discovery/home/navigation/legacy-worker files. Earlier affected-suite run passed 59 tests before the three account-type checks were added; final full run covers those additions.
- The first exploratory run found immediate navigation assertions that needed to await React Router’s committed state. Those assertions were corrected; the rapid category-plus-submit regression remains covered.
- ESLint: `npm run lint --prefix frontend` — passed, exit 0. Production: `npm run build --prefix frontend` — passed, exit 0 (10.67s). `git diff --check` passed.
- Backend Java/schema unchanged; no Maven test rerun required. Real browser acceptance uses the existing packaged Spring Boot backend.

Browser fixtures ran only against guarded `127.0.0.1:55432/kasicircle_qa` (PostgreSQL 18.6), with Spring Boot on 18081 and Vite on 5176. This run does not enable Cloudinary credentials. Fixtures are controlled QA accounts/businesses/profiles plus one test-owned image row pointing to a local image; there are no live image-provider writes. The development database is untouched. No push, merge, deployment or Sprint 17 work is authorized.


### Browser results

- `cd frontend && npx playwright test`: 23 completed passes; runner terminated with exit 143 before the last review-dialog case. This invocation did **not** exit successfully.
- `cd frontend && npx playwright test --grep 'unified marketplace uses|mobile review controls'`: **3 passed**, exit 0 (1.9m). Completes the interrupted review-dialog check and reruns both unified journeys after refreshing capture positioning and adding negative city filtering.
- Across these invocations **all 24 distinct browser cases passed**: 16 actual API/PostgreSQL marketplace cases and 8 explicitly fixture-driven responsive/keyboard cases. The fixture suite is not counted as real-backend acceptance. Sanitized per-case evidence: [browser-checks.txt](unified-marketplace/browser-checks.txt).
- New real journeys create nine businesses and nine independent workers per project using registered QA-owned accounts. They verify home shared keyword/city entry, All/Businesses/Workers, city mismatch producing both empty states, scoped filters, independent 8+1 paging and exact totals of nine per source, tab/history persistence, both actual detail routes, reset, decoded images and no document overflow.
- Existing real journeys cover reviews/ratings and duplicate/self-review rejection; worker profile editing and messaging/ownership; jobs, private applications and notifications; moderation restrictions; registration/login/logout route protection; business editing, image rendering and legacy worker/job navigation.
- Responsive QA covers all configured routes at **375, 768, 1280 and 1440px**, one main/heading, named fields, button targets, no horizontal overflow, navigation, keyboard gallery/account/skip-link behavior, loading/error/retry/reduced-motion and mobile review/delete-dialog access.
- Unit coverage additionally exercises either API failing independently, both failing, independent retry, stale responses, colliding source IDs, URL back/forward restoration, malformed/missing metadata, out-of-range pages, filter reset and each account type’s management navigation.

## Visual acceptance

Manually reviewed final real-backend screenshots at [375px](unified-marketplace/explore-375.png), [768px](unified-marketplace/explore-768.png), and [1440px](unified-marketplace/explore-1440.png). Captures show the final page of each nine-record source: one card in each section while totals remain nine and both controls show page 2 of 2. This deliberately demonstrates independent pagination rather than suggesting only one provider exists.

The existing plum header/footer, cream surfaces, marigold actions, Bricolage/DM Sans typography, storefront hero, rounded cards and business image/rating treatment remain. Desktop/tablet retain the hero image; mobile retains the existing text-first hero, stacked search/filter inputs, horizontally scrolling business categories and bottom navigation. Provider labels, worker initials/skills, source totals and actual detail links are readable. No broken images or horizontal document overflow appeared in these captures/checks. The fixed bottom navigation appears at the original viewport’s bottom inside tall full-page screenshots; it remains a normal fixed viewport control when browsing.

Intentional differences from the previous business-only Explore design are the revised heading/copy, provider tabs, scoped worker filters, provider badges and second results section. The All page is longer because both directories are visible. Tablet retains the existing three-column grid; sparse last pages leave unused columns. No exact visual-parity claim is made.

## Remaining limitations and operational state

- Existing business keyword matching is name-only; searching “plumber” cannot discover a business whose name lacks that word solely because its description/category mentions plumbing. Worker public profile text has broader matching. Backend/API expansion would be separate work.
- Business city matching is exact; worker city matching is a substring. Both APIs retain their original semantics. No combined sort, relevance score, total or cross-source pagination is supported or implied.
- Source-specific filters remain stored while their provider tab is hidden. Reset clears them; switching tabs preserves them.
- Unknown pagination metadata is described as records shown on the current page, without inventing totals or more pages. Actual Spring pages supply the required metadata.
- No live Cloudinary upload/delete acceptance is included. Controlled local image fixtures exercise persisted image rendering only.
- No known failing application workflow remains in this change’s verified scope. QA fixtures remain only in the isolated database; its cluster is stopped after verification. Development and production data were not used.

## Local commits

Branch: `Feature/Authentication`. Implementation commits:

- `9601fb835bd89b04c7687593764e3c939b591cb1` — unified discovery and regression coverage.
- `3525c10aa47240e1f3c82cf28bdd08119f5cc89f` — shared homepage entry and preserved account navigation.

The subsequent `test(discovery): record isolated marketplace acceptance` commit contains browser changes, this report and the three sanitized screenshots. Its exact hash is supplied in the final handoff (`git log -1` at that point). No push, merge, deployment or Sprint 17 changes were performed.
