# Marketplace Map — Sprint 1

Verification completed 16 November 2026 (Africa/Johannesburg).

Baseline: local `Feature/Authentication`, HEAD `f795dc9`; working tree clean at start. All existing profile-picture commits and subsequent local work retained. This sprint adds a frontend foundation only. No backend schema, authentication, account-type or Cloudinary code changes; no geocoding, deployment or push.

## Architecture and coordinate assessment

Reviewed Explore, ProviderResults, ProviderCard, the whitelisted provider model, useProviderResults, API clients, the Business entity/DTO/mapper/controller, existing migrations through V12, frontend tests and existing Playwright configurations.

**No business coordinates exist in the current application contract.** `Business` and `BusinessResponse` expose public address/city/province but no latitude/longitude. The migrations do not define coordinate columns. Street addresses and township names are never converted to pins. Existing API results therefore display the honest “Precise business locations are not available on this page yet” state; all businesses remain discoverable in List View.

The business presentation model can carry optional public `latitude` and `longitude` numeric fields when a future backend provides them. Worker coordinates, residential addresses and private fields are not copied into worker presentation models or passed to the map.

## Dependencies and references

Installed exact stable versions:

- `leaflet@1.9.4`
- `react-leaflet@4.2.1` (transitive `@react-leaflet/core@2.1.0`)

Before installing, npm metadata confirmed React Leaflet 4.2.1 peers: React `^18.0.0`, React DOM `^18.0.0`, Leaflet `^1.9.0`. `npm ls` confirms the existing React/React DOM 18.3.1 are retained and deduplicated. No React/framework upgrade. Install audit reported zero vulnerabilities.

Primary references: [React Leaflet v4 installation](https://react-leaflet.js.org/docs/v4/start-installation/), [v4 MapContainer and hooks](https://react-leaflet.js.org/docs/v4/api-map/), and [official OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

## UI and marker behavior

`/explore` defaults to List View. Native List View / Map View buttons form an accessible pressed-state group. Map selection uses `view=map`; absent or invalid values show List View. Search, township, categories, worker criteria and both page parameters survive switches. Browser Back/Forward restores the view. Switching views does not refetch unchanged directory data or discard unsubmitted search drafts.

The Leaflet code and CSS are lazy-loaded on selecting a business-capable Map View. Explicit Vite image imports resolve the standard/retina marker and shadow assets. The map chunk has an error boundary with a List View fallback. API loading/error/retry states are preserved independently of map rendering.

- All: map eligible businesses from the loaded business page, retain the worker list below and explain worker privacy.
- Businesses: business map and its existing independent page controls.
- Workers: retain the complete worker list and explain why private/unapproved worker locations are not plotted; no map initialization or tile requests.

A pin requires business type plus finite numeric `latitude` in [-90,90] and `longitude` in [-180,180]. Nulls, strings, booleans, missing pairs, NaN, infinity and out-of-range values are rejected. Zero coordinates are valid. Popups show public business name, category and address/city/province, with a link to the existing business detail route. React renders popup text safely. Bounds fit valid loaded markers with capped zoom; page/filter changes update the visible set. An empty map uses a general South African extent, never a fabricated business position or a personal location. The app does not request device geolocation.

The responsive map is 400px high on mobile and 480px on larger screens, with keyboard-focusable markers, zoom controls, visible focus indicators, wrapped popups and attribution. Map, popup and zoom transitions are disabled to respect reduced motion. Arrow-key pans and keyboard zoom are immediate, including Shift+arrow movement; normal Tab/browser shortcuts are retained. Open popups are measured after portal layout and panned inside the map without animation, with bounded scrollable content for long descriptions. List View remains usable if tiles or the map chunk fail.

## Pagination limitation

The existing page-size-8 API requests remain unchanged. The map states the current business page and its valid pin count, explicitly says it does not show all matching results, and reports missing locations among loaded businesses. Existing business/worker totals and page controls stay independent. No unbounded requests, combined provider totals or viewport-wide discovery are introduced. Businesses on other pages require paging; businesses with missing coordinates require List View.

## Tile configuration and usage

Development default: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, with visible linked OpenStreetMap copyright attribution. Production has **no automatic public OSM tile default**: select a suitable provider and configure both public Vite variables in the frontend build environment (for example, `frontend/.env.production.local`) and rebuild before launch:

```dotenv
VITE_MAP_TILE_URL=https://your-provider.example/{z}/{x}/{y}.png
VITE_MAP_TILE_ATTRIBUTION=Provider-required attribution HTML
```

These are public frontend settings, embedded at build time; never put a secret service credential here. A custom URL requires explicit attribution. Without complete production configuration, the map explains that tiles are not configured; pins and List View remain available.

Tiles use ordinary browser image caching and honour provider HTTP cache headers. No cache-busting query parameters, forced no-cache headers, bulk download, offline mode, background prefetch, tile proxy, address search or Nominatim requests are added. `keepBuffer=0`, idle updates and direct initial bounds reduce unnecessary requests. Tile images explicitly use `strict-origin-when-cross-origin` to retain a valid origin Referer. Tile errors display a readable warning and retry action without erasing pins or search state. Production selection must include provider capacity, terms, attribution, zoom coverage, permitted client keys and privacy review.

## Exact next steps for owner-managed pins (Sprint 2 — not implemented here)

1. Add the next available Flyway migration (currently V13) with nullable `businesses.latitude DOUBLE PRECISION`, `businesses.longitude DOUBLE PRECISION`, and `businesses.location_public BOOLEAN NOT NULL DEFAULT FALSE`. Require coordinates to be either both null or both finite/in-range; require a valid pair before publishing. Preserve existing businesses without locations. Do not add worker location fields.
2. Extend Business persistence and owner-facing request/response DTOs with `latitude`, `longitude`, `locationPublic`. Expose nullable numeric `latitude` / `longitude` in the existing public BusinessResponse only when `locationPublic` is true and both values validate; otherwise return nulls. Keep owner-only drafts out of public search/detail responses. Update mapper/service tests and existing constructor/builders compatibly.
3. Add owner-only `GET /api/businesses/{id}/location`, `PUT /api/businesses/{id}/location` and `DELETE /api/businesses/{id}/location`, reusing the current business ownership checks and account rules. The owner GET returns draft coordinates plus `locationPublic`; PUT requires an explicit complete `{latitude, longitude, locationPublic}` location payload; DELETE clears both coordinates and sets publication false. Unrelated users cannot read private drafts or modify locations. Ordinary business profile edits must preserve location fields, including requests from older clients that omit them. Keep public GET routes read-only and expose only published coordinates; preserve current API pagination and filtering.
4. Add an optional picker to BusinessProfile: move/place a pin, keyboard-accessible numeric latitude/longitude fields, a clear public-location consent toggle, preview, Save/Cancel and Remove location. Show that the pin will be public and ask owners to choose a business-facing entrance rather than a home. Start at a general extent; do not derive a precise coordinate from an address or silently publish geolocation. Validate server-side and client-side.
5. Verify owner-only write authorization, unpublished draft privacy, valid bounds/finite values, removal, existing null-location businesses, persisted public search/detail coordinates, and real map/list pagination. Use isolated QA data and controlled tiles. No location-management backend or picker is started in Sprint 1.

## Files changed

- `frontend/package.json`, `frontend/package-lock.json`
- `frontend/src/pages/Explore.jsx`
- `frontend/src/components/ProviderResults.jsx`
- `frontend/src/models/provider.js`
- `frontend/src/models/mapLocation.js`
- `frontend/src/components/MarketplaceMap.jsx`
- `frontend/src/components/MarketplaceMapBoundary.jsx`
- `frontend/src/styles/marketplace-map.css`
- `frontend/src/components/MarketplaceMap.test.jsx`
- `frontend/src/pages/MarketplaceMapExplore.test.jsx`
- `frontend/e2e/map.spec.js`, `frontend/playwright.map.config.js`
- `docs/MARKETPLACE_MAP_SPRINT_1.md` and screenshot evidence listed below

## Verification and screenshots

Automated map browser tests use a local SVG tile fixture and explicit synthetic public business-coordinate API fixtures, never real businesses or public tile/geocoding services. Screenshots of pins demonstrate the frontend contract, not newly stored production locations. Missing-coordinate screenshots use controlled fixtures matching the current backend's absent-coordinate contract. Existing browser QA remains separate from these map fixtures.

Verification results:

- Focused map unit/routing tests: **29 passed**. Existing Explore tests also passed in the focused run.
- Full frontend: `npm test -- --maxWorkers=1` — **308 passed across 43 files**.
- Relevant backend: `mvn -Dtest=BusinessControllerTest,BusinessServiceTest,WorkerProfileControllerTest test` — **57 passed**, no failures/errors/skips. H2/mocks; no backend source changes.
- ESLint: `npm run lint` — passed.
- Production build: `npm run build` — passed; Leaflet JS/CSS emitted as a separate lazy chunk.
- Controlled map browsers: `npx playwright test --config=playwright.map.config.js` — **6 passed** at 375/768/1440px plus missing-coordinate, tile-failure and worker-privacy cases. Fixture assertions verify zero public OSM/Nominatim requests, working marker assets and Referer policy, keyboard/focus, zoom, navigation, page scoping and no overflow.

Screenshot evidence (controlled tiles and synthetic public coordinate fixtures, not real mapped businesses):

- [Desktop Explore map](marketplace-map-sprint-1/explore-map-1440.png)
- [Desktop map and business popup](marketplace-map-sprint-1/map-pins-1440.png)
- [Mobile Explore map](marketplace-map-sprint-1/explore-map-375.png)
- [Mobile map and business popup](marketplace-map-sprint-1/map-pins-375.png)
- [Missing-coordinate fixture matching the current backend](marketplace-map-sprint-1/map-no-coordinates-375.png)
- [Recoverable tile failure](marketplace-map-sprint-1/map-tile-failure-375.png)

Visual review caught an initially clipped popup; it was fixed, the map tests were rerun, and the final browser suite asserts the entire popup stays within the map at 375/768/1440px. The screenshots above were regenerated from that passing run.

- Existing desktop/mobile browser QA: `npx playwright test --project=desktop --project=mobile --output=test-results/map-existing-real` — **18 passed**, including reviews, workers, messaging, jobs, moderation, registration, business galleries, unified discovery and profile-picture endpoints. Test-owned writes targeted only the identity-checked QA PostgreSQL database on port 55432; Cloudinary credentials were explicitly blank. No development data changes or Cloudinary operations occurred.

- Existing responsive browser QA: `npx playwright test --project=responsive --output=test-results/map-existing-responsive` — **10 passed**. All existing route layouts at 375/768/1280/1440px, navigation, keyboard/focus, loading/error/retry, reduced-motion and avatar lifecycle checks remain green. Total browser coverage: **34 passed** (6 new map cases + 28 existing cases).

## Sprint 1 completion limits

No backend coordinates, coordinate migration, owner picker or geocoding was added. Current real directory records show the documented missing-coordinate state; the marker screenshots intentionally use explicit QA fixtures. Owner-managed public pins remain Sprint 2 work only. A production tile provider and its required attribution must be selected/configured before launch. Public tile servers were not used for automated testing. No Cloudinary functionality, account types or authentication/authorization rules were changed. No development database writes, push, deployment or Sprint 17 work occurred.

The final map browser run also asserts zoom controls do not overlap attribution; screenshots were regenerated after the spacing correction and visually inspected. Final lint and production build passed after all source/style changes. The final focused map run passed 29 tests after the popup/keyboard refinements, alongside the passing 308-test full suite.

## Runner exit-status audit

Initial long browser command wrappers reported signal termination after their passing 18-case and 10-case test summaries. The implementation checks were retained and process results were rechecked with a direct Node runner in isolated sessions, recording exit codes explicitly. Desktop repeated **9/9 with exit 0**. A concurrent mobile/responsive recheck hit memory pressure: one mobile job case timed out and the competing responsive run was interrupted to free resources. Mobile then completed eight cases and its isolated job retry passed in 26.6 seconds with **exit 0**, covering all nine mobile cases. The 375/768px responsive group repeated **2/2 with exit 0**; the remaining desktop-layout/accessibility/avatar group repeated **8/8 with exit 0**. All ten responsive cases therefore have clean bounded-run results. No application code or test timeouts were changed to address the runner discrepancy; the final retries run sequentially.

## Local commits

- `8baf24d` — map implementation, pinned dependencies and unit/routing tests.
- `48aa05d` — controlled browser tests, map QA configuration and six reviewed screenshot artifacts.

The report itself is committed separately; its hash is supplied in the completion reply. The temporary QA PostgreSQL and fixture frontend servers were stopped after verification, preserving database files. The final working tree contains no uncommitted sprint changes.
