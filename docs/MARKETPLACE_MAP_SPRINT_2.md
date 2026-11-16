# Marketplace Map — Sprint 2: Business location management

Implementation baseline: local `Feature/Authentication`, `38bf6ff` (Sprint 1 complete). All unpublished work retained. During implementation local commit `a722443` recorded the new entity/controller/location DTO additions; it is preserved. Verification date: 16 November 2026, Africa/Johannesburg.

## Migration and data safety

`V13__add_business_locations.sql` is the next migration after V12. It adds nullable `businesses.latitude DOUBLE PRECISION`, nullable `longitude DOUBLE PRECISION`, and `location_public BOOLEAN NOT NULL DEFAULT FALSE`.

Four database checks require paired nullability, latitude in [-90,90], longitude in [-180,180], and non-null coordinates for publication. The bounds reject infinities and PostgreSQL NaN values, which sort above other floating-point values ([PostgreSQL numeric documentation](https://www.postgresql.org/docs/18/datatype-numeric.html)). Service validation independently requires finite values and explicit non-null publication consent.

V13 was applied only by the test backend to the guarded QA PostgreSQL cluster `127.0.0.1:55432/kasicircle_qa`. The live database/port/isolation-marker preflight passed. The post-migration audit reported **13 successful migrations** and **zero pre-existing businesses with coordinates or publication**. Existing businesses remain unmapped, accounts and galleries remain intact, and no worker/customer location fields were added. No reset, database overwrite, development fixture writes or real business location edits were performed.

## APIs and ownership

| Method | Endpoint | Success |
| --- | --- | --- |
| GET | `/api/businesses/{id}/location` | 200, owner-only draft `{latitude, longitude, locationPublic}` |
| PUT | `/api/businesses/{id}/location` | 200, persisted draft/publication response |
| DELETE | `/api/businesses/{id}/location` | 200, `{latitude:null, longitude:null, locationPublic:false}`; idempotent |

PUT uses explicit JSON coordinate and consent values. Both coordinates may be null only with publication false; partial, non-finite and out-of-range pairs or missing consent return 400. DELETE clears the pin without deleting the listing, photos or reviews.

All three operations require an authenticated BUSINESS account and reuse the existing business ownership check. Anonymous access returns 401 and non-BUSINESS/other-owner access returns 403. There is no administrator ownership bypass. The new private read is guarded in the service even though the existing public business GET URL prefix remains public; global security configuration and existing authentication rules were not changed.

Location writes serialize on the business row with a pessimistic lock and commit the pair and consent in one transaction. `@DynamicUpdate` keeps ordinary profile edits from overwriting location fields from a stale snapshot and keeps location edits from overwriting unrelated profile fields. Existing Create/UpdateBusinessRequest payloads are unchanged and cannot change location consent. The old BusinessResponse constructor remains compatible.

## Public privacy and marketplace behavior

BusinessResponse adds nullable numeric `latitude` and `longitude`. BusinessMapper emits both only when publication is true and both coordinates are valid; otherwise it emits nulls. The same mapper protects public search, detail and the current-user listing responses. Private drafts are retrieved separately through the owner-only location endpoint; they are not placed in AuthContext or localStorage.

The existing Sprint 1 adapter and map consume published coordinates directly. A newly published pin appears on the current loaded business page, with the existing name/category/public-address popup and detail link. Hiding or removing a pin produces nulls in fresh public search/detail responses and removes it from a freshly loaded Explore map; the business remains in List View. Independent provider pagination, page-size-8 requests, filters, view URL behavior and worker discovery are preserved. Workers are never passed to the business map.

## Owner editor and map reuse

BusinessProfile has a full-width business-location section without replacing contact, account or gallery controls. Its Set business location action explicitly loads the private owner draft. Opening an empty draft starts at the general South African extent with no pin; no address/township lookup or device geolocation occurs.

Owners can click to place, drag to move, or use labelled numeric latitude/longitude fields. Pin changes do not turn publication on. A visible consent checkbox explains precise public location sharing, with home-based business guidance to select a public-facing business location or keep the exact position private. Save persists an explicit payload; Cancel discards edits; Remove clears the saved location. Loading, validation, success and failure states preserve retryable edits and the last confirmed saved state. Mutations disable fields, placement and duplicate actions; keyboard focus returns to the action after closing.

The picker is lazy-loaded. Shared `mapRuntime.jsx` reuses Leaflet marker assets, tile settings, linked attribution, tile failure/retry handling and non-animated keyboard controls from Sprint 1. The public map's existing viewport/popup logic remains in place. Numeric entry remains available if the picker or its tiles fail. Mobile controls wrap and the map retains a 400px minimum mobile height. Production still requires the Sprint 1 tile-provider configuration; automated tests use local SVG tile fixtures and never request public OSM/Nominatim tiles.

## Verification

- Backend: **78 passed** across new BusinessLocationTest and existing business controller/service and worker controller regressions. New tests use mocked repositories, covering legacy/null listings, valid private/public/hide/remove operations, finite/range edges, malformed/non-finite payloads, anonymous access, all non-owner account types, private/invalid DTO redaction, and legacy business update compatibility.
- Full frontend: **321 passed across 46 files**, including existing profile-picture/Sprint 1 coverage, owner load/edit/save/cancel/publish/hide/remove/error/loading states, actual Leaflet picker placement, keyboard behavior and authenticated API handling.
- Production build: passed. Shared Leaflet code remains in a lazy runtime chunk; the owner editor does not initialize a map until explicitly opened.
- ESLint: passed.
- New real-API/QA PostgreSQL browser acceptance: **4 passed** (two cases each on desktop and mobile). Each lifecycle creates a temporary QA BUSINESS account/listing, places and drags a pin, cancels without writing, edits coordinates, saves privately, publishes, reloads, opens the public marker/detail, hides it, verifies List View, and removes it. Additional checks cover anonymous/resident/worker/other-owner JWT denials and old-client updates under both consent states.
- Direct PostgreSQL checks run inside rolled-back transactions on a newly created QA fixture. PL/pgSQL catches only `check_violation`, proving the actual database rejects NaN, positive/negative infinity, invalid ranges, incomplete pairs and publication without coordinates. A connectivity or other SQL error cannot count as a successful constraint check.

Initial browser setup caught an empty registration response in the new test helper; it was corrected to match the existing API convention. The successful acceptance runs use the unchanged application registration/authentication behavior. No test assertions were waived.

Existing browser regressions completed:

- Sprint 1 map: **6 passed** with controlled tiles, including URL/list behavior, public pins, current-page pagination, worker privacy, tile failure, keyboard controls, popup bounds and attribution.
- Existing real marketplace journeys: **18 passed** (9 desktop + 9 mobile), each with recorded process exit 0. Reviews, workers, jobs, messaging, moderation, registration, business/image browsing, unified discovery and profile-picture endpoints remain green. Live Cloudinary credentials stayed blank.
- Existing responsive UI: **10 passed** (375/768px route group 2/2; desktop layout/navigation/accessibility/avatar group 8/8), with recorded exit 0 for both bounded runs. All route layouts, keyboard/focus, loading/error/retry, reduced-motion and account-avatar lifecycle checks remain intact.
- Total browser acceptance: **38 distinct cases passed**: 4 new real-API location cases + 18 existing real-backend cases + 6 Sprint 1 map cases + 10 existing responsive UI cases.
- Dashboard layout follow-up: **31 BusinessProfile tests passed** after the new full-width section was placed above the existing two-column cards.
- Final QA audit: **13 successful migrations; 0 remaining published locations; 0 remaining stored coordinate pairs**. Temporary test businesses remain as isolated QA fixtures with their locations cleared. The QA database server was stopped without deleting its files.

## Reproducing the checks

Use the existing guarded QA setup described in `docs/QA.md`; start that isolated cluster before real-backend browser tests. Never point these tests at development. Cloudinary credentials remain blank in the browser configuration.

From the repository root:

```sh
mvn -f backend/pom.xml -Dtest=BusinessLocationTest,BusinessControllerTest,BusinessServiceTest,WorkerProfileControllerTest test
npm test --prefix frontend -- --maxWorkers=1
npm run lint --prefix frontend
npm run build --prefix frontend
```

From `frontend`, after packaging the backend:

```sh
node node_modules/@playwright/test/cli.js test --config=playwright.location.config.js --project=desktop
node node_modules/@playwright/test/cli.js test --config=playwright.location.config.js --project=mobile
node node_modules/@playwright/test/cli.js test --config=playwright.map.config.js
```

Existing desktop and mobile projects were run separately with a bounded QA JVM (`JAVA_TOOL_OPTIONS=-Xmx384m`) and direct runner exit-code recording. Existing UI fixtures use `playwright.visual.config.js` with a local frontend at port 5174. Those ten cases are split into the 375/768px route group and its complement to keep runs bounded; every existing case is included. Test timeouts and assertions are unchanged.

## Remaining limitations

- Other environments must run normal Flyway V13 migrations before starting this backend. This sprint does not migrate/reset development or production databases.
- A production-suitable tile provider and attribution must be configured before launch, as documented in Sprint 1. There is no geocoding, offline tile download or paid map credential requirement.
- Explore maps the current business page and refreshes on normal navigation/search/page changes; it does not push location changes into other already-open browser sessions.
- Publication is an explicit owner choice, not a location-verification/moderation process. Worker/customer home locations remain outside this feature.

No Cloudinary credentials or functionality were modified, no live images were uploaded/deleted, no account types were changed, and no push, merge, deployment or Sprint 17 work occurred. Work stops at Map Sprint 2.

## Screenshots

Controlled local tile images and temporary test-owned businesses, using real QA API persistence. No real business location was edited.

- [Desktop owner editor and explicit publication consent](marketplace-map-sprint-2/owner-location-editor-desktop.png)
- [Mobile owner editor and coordinate controls](marketplace-map-sprint-2/owner-location-editor-mobile.png)
- [Published QA business marker on desktop Explore](marketplace-map-sprint-2/published-location-desktop.png)
- [Published QA business marker on mobile Explore](marketplace-map-sprint-2/published-location-mobile.png)

## Files created or modified

- `backend/src/main/java/com/kasicircle/backend/businesses/controller/BusinessController.java`
- `backend/src/main/java/com/kasicircle/backend/businesses/domain/Business.java`
- `backend/src/main/java/com/kasicircle/backend/businesses/dto/BusinessLocationRequest.java`
- `backend/src/main/java/com/kasicircle/backend/businesses/dto/BusinessLocationResponse.java`
- `backend/src/main/java/com/kasicircle/backend/businesses/dto/BusinessResponse.java`
- `backend/src/main/java/com/kasicircle/backend/businesses/location/BusinessCoordinates.java`
- `backend/src/main/java/com/kasicircle/backend/businesses/mapper/BusinessMapper.java`
- `backend/src/main/java/com/kasicircle/backend/businesses/repository/BusinessRepository.java`
- `backend/src/main/java/com/kasicircle/backend/businesses/service/BusinessService.java`
- `backend/src/main/java/com/kasicircle/backend/businesses/service/BusinessServiceImpl.java`
- `backend/src/main/resources/db/migration/V13__add_business_locations.sql`
- `backend/src/test/java/com/kasicircle/backend/businesses/location/BusinessLocationTest.java`
- `docs/MARKETPLACE_MAP_SPRINT_2.md`
- `frontend/e2e/location.spec.js`
- `frontend/playwright.location.config.js`
- `frontend/src/components/BusinessLocationEditor.jsx`
- `frontend/src/components/BusinessLocationEditor.test.jsx`
- `frontend/src/components/BusinessLocationPicker.jsx`
- `frontend/src/components/BusinessLocationPicker.test.jsx`
- `frontend/src/components/MarketplaceMap.jsx`
- `frontend/src/components/mapRuntime.jsx`
- `frontend/src/models/mapLocation.js`
- `frontend/src/pages/BusinessProfile.jsx`
- `frontend/src/services/api.js`
- `frontend/src/services/businessLocationApi.test.js`
- `frontend/src/styles/business-location.css`

## Local commits

- `a722443` — existing local entity/controller/location DTO commit, preserved.
- `268b48e` — location service, public redaction, row lock, V13 and backend tests.
- `b516538` — owner location editor, lazy picker, shared map runtime, authenticated API client and frontend tests.

Browser tests, the four screenshot artifacts and this report are committed together; the final verification commit hash is supplied in the completion reply.

Final lint, production build and whitespace checks passed. Desktop and mobile screenshot artifacts were visually inspected. The temporary fixture frontend was stopped after its recorded successful runs; no uncommitted Sprint 2 changes remain after the verification commit.
