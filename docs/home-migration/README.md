# Homepage source migration

Reference: `/home/tsmthethwa/Projects/KasiCircleDesignReference/KasiCircle-Demo`.
Only the working application's homepage presentation is migrated. Reference files remain unchanged.

## Source mapping

| Original file | Application adaptation |
| --- | --- |
| `src/showcase/Explore.jsx` | `frontend/src/pages/Home.jsx`: exact hero structure and copy, floating information card, business/location search, directory grid and category sidebar. Search submits to the existing `/explore?search=…&city=…` route. Category buttons call the real API. |
| `src/showcase/shared.jsx` | `frontend/src/components/HomeBusinessCard.jsx`: original category definitions and card markup. Uses actual names, descriptions, photos, locations and rating aggregates, without fictional-data cleanup or demo ID artwork lookup. |
| `src/App.jsx` | `frontend/src/components/AppShell.jsx`: original four-square logo, restricted to `/home`. Existing account controls, authentication, destinations and mobile menu remain functional. |
| `src/index.css` | `frontend/src/styles/home-reference.css`: source color tokens, typography, hero, search, directory, cards and responsive rules scoped beneath `.reference-home`. Demo, profile and about selectors excluded; production header controls adapted. |
| `public/demo-assets/neighbourhood-hero.svg` | `frontend/public/demo-assets/neighbourhood-hero.svg`, copied unchanged. |
| `NOTICE`, `LICENSE` | `frontend/public/demo-assets/NOTICE`, `LICENSE.txt`, preserving attribution and documenting adaptation. |

`src/showcase/BusinessDetail.jsx` was inspected for context; no business-detail components were migrated. No demo API, auth stub, records, sample review aggregates, source links or preview banners were copied. No additional dependencies or external fonts are needed: the source uses Arial/Helvetica with Georgia italic emphasis.

## Intentional differences

- Production omits the reference's 35px desktop / 44px mobile preview banner. The hero therefore starts higher by those amounts.
- Header links expose Home, Businesses, Workers, Jobs and real account controls rather than the demo story/source links.
- The homepage previews three actual API listings and links to the full, existing directory. It does not reproduce the demo's client-side pagination and sorting over fictional records.
- Business photos and real ratings replace sample artwork and records. Missing/failed photos show “No photo provided.”
- Worker/job searches, skills, marketplace shortcuts and category shortcuts remain below the directory. The production footer remains.
- On `/home`, the existing mobile bottom bar is hidden to prevent obscuring the source search panel. The mobile header menu retains all marketplace destinations, and signed-in account controls retain profile/messages/notifications access.
- Existing 44px touch controls are retained where source buttons were smaller; the hero browse button uses negative margins to preserve text placement.

## Visual evidence

Exact viewport screenshots captured with Chromium using identical viewport widths/heights:

| Viewport | Reference | Working application |
| --- | --- | --- |
| 1440 × 900 | [Reference](reference-desktop-viewport.png) | [Homepage](home-desktop-viewport.png) |
| 375 × 812 | [Reference](reference-mobile-viewport.png) | [Homepage](home-mobile-viewport.png) |

Measured hero content: desktop 1256 × 423.03125px; mobile 339 × 575.34375px in both applications. Headline: desktop 61px / 65.88px line height, mobile 38px / 41.04px in both. Neither viewport has horizontal overflow. Reference hero top: 121px desktop, 114px mobile; application: 86px desktop, 70px mobile (banner removal).

The direct application screenshots show the real network-error state because its backend was unreachable during capture. Browser QA uses explicitly isolated existing test fixtures to validate populated cards; no test fixtures are shipped as application data.

Full-page comparison: [reference desktop](reference-desktop.png), [homepage desktop](home-desktop.png), [reference mobile](reference-mobile.png), [homepage mobile](home-mobile.png).

Additional populated-card evidence (existing browser QA fixtures, clearly separate from production data): [desktop](home-desktop-qa-fixture.png), [mobile](home-mobile-qa-fixture.png).

Reproduce direct comparison with `node docs/home-migration/compare.mjs` while the production frontend runs on port 5174 and a temporary reference copy runs on port 5175. `CHROME_PATH` can override the Chrome executable. The script captures full-page images at the required viewport sizes and prints hero geometry, headline font/line height and overflow measurements.

Modified application files: `frontend/src/pages/Home.jsx`, `frontend/src/pages/Home.test.jsx`, `frontend/src/components/AppShell.jsx`, `frontend/e2e/ui.spec.js`. Added `frontend/src/components/HomeBusinessCard.jsx`, `frontend/src/styles/home-reference.css`, the licensed hero asset and this comparison/report directory. Browser QA's job-search selector was narrowed because homepage business search now remains visible alongside the retained job-search field. Backend, routing, API service, AuthContext and package configuration were not modified.

## Functionality and validation

- Homepage tests cover real API listing fields, loading/empty/error/retry states, business detail links, business search with location, API category filtering, worker search, worker skill links and job search/navigation.
- Existing `e2e/ui.spec.js` passed all eight checks across the initial run and a successful retry of a transient 375px business-management readiness timeout. Checks cover all routes at 375/768/1280/1440px, labeled inputs, touch targets, overflow, mobile navigation, scoped job search, keyboard/gallery/account/skip-link focus, and profile/review behavior. These run with the suite's explicit browser fixtures, without a database.
- Live backend/database marketplace journeys were not run: an isolated `E2E_DATABASE_URL` was not configured, and the frontend's backend endpoint was unreachable. No production data was changed to run QA.
- ESLint and production build passed.
- Relevant homepage tests: **10/10 passed** (`npm test -- --maxWorkers=1 src/pages/Home.test.jsx`).
- Final complete sequential suite: **37/37 files, 226/226 tests passed** (`npm test -- --maxWorkers=1 --no-file-parallelism`, 182.49 seconds). Existing expected-error/React act warnings are emitted by some tests; they do not fail the suite.
- Production build: **passed**, 1382 modules transformed. ESLint: **passed**. `git diff --check`: **passed**. Copied hero SVG byte-compares equal to the original.
