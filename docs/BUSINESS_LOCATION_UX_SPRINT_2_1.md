# Business location UX — Sprint 2.1

Implemented on local `Feature/Authentication`, based on `3b6c8c8`. This sprint changes the owner interface, not the location backend.

## An ordinary owner's journey

Open Business Profile → Set/Manage business location. The editor reads the current owner-only saved location and offers five steps:

1. **Find your area.** Search for a familiar place when an approved provider is configured, use the device location with permission, or choose the map. Existing owners can review their saved pin.
2. **Mark where your business is.** Tap/click to place a pin, drag it to move it, and zoom. Keyboard users can pan with arrows, zoom with +/− and activate **Place pin in the middle of the map**. Choose **Confirm this location**. Numerical entry remains optional under the initially collapsed **Advanced: Enter GPS coordinates** section, with paired finite/range validation.
3. **Review the location.** A separate map shows the draft; move it again if necessary. No write has happened.
4. **Choose who can see the pin.** Sharing defaults off for new/private locations. Plain language explains that sharing reveals this exact spot and gives guidance for home-based businesses.
5. **Save.** A final summary states whether the pin will be private or public. Only the final Save persists edits. Back and Cancel preserve the existing saved location. A failed save retains the draft for retry.

Saved states explicitly distinguish no location, private draft and published pin. Remove location remains an explicit separate action; it clears the location only and retains the business listing. Enter on earlier steps cannot submit a partial location. Search results and device suggestions require confirmation; neither automatically saves or publishes a pin.

## Place search configuration and missing setup

**Live lookup is disabled by default. No approved provider/proxy has been configured or deployed in this sprint.** The map picker and optional device method remain usable. The disabled search explains the alternatives. Browser tests use clearly marked controlled QA responses, not real lookup results.

The client supports an explicitly enabled, same-origin **Photon-compatible proxy**:

```dotenv
VITE_PLACE_SEARCH_ENABLED=true
VITE_PLACE_SEARCH_URL=/api/places/search
VITE_PLACE_SEARCH_ATTRIBUTION=© OpenStreetMap contributors — Photon
VITE_PLACE_SEARCH_ATTRIBUTION_URL=https://www.openstreetmap.org/copyright
```

These are public build-time settings. Rebuild after changing them. The endpoint above is an example configuration, **not a new backend endpoint implemented here**. An operator must approve/provision a same-origin proxy to a self-hosted or otherwise approved Photon instance first. It must accept `GET ?q=…&limit=5` and return Photon GeoJSON `features`, with Point geometry `[longitude, latitude]` and place properties. Configure the attribution required by the actual data/provider. Missing approval, unsafe URL configuration, missing credit or invalid credit URL keeps search disabled. Absolute provider URLs, protocol-relative URLs and query-string secrets are rejected.

The adapter performs explicit submitted searches, not autocomplete; no public Nominatim or public Photon endpoint is configured or contacted. It sends the current session JWT only to the same origin, disallows redirects, requests `cache: no-store`, aborts stale requests and keeps results transient. It bounds displayed results and validates numeric coordinates. Only the owner's confirmed point is saved through the existing location API; place labels and search queries are not persisted by the application. Empty, malformed, failed and unavailable responses offer the map instead of invented results.

Before enabling an operator-owned proxy: enforce authentication/authorization, rate limits, request/response size limits and timeouts there; strip the application JWT before forwarding upstream; protect upstream credentials server-side; review provider/data licenses, retention, logs and cache behavior. `no-store` on the browser request does not establish a provider's retention policy. Photon is open source and supports self-hosting; its public demo has throttling and no availability guarantee ([Photon documentation](https://github.com/komoot/photon/blob/master/README.md), [API contract](https://github.com/komoot/photon/blob/master/docs/api-v1.md)). OSM-derived data requires applicable attribution and license compliance ([OSM copyright and license](https://www.openstreetmap.org/copyright)). No paid API was selected or enabled, so there is no new API billing; self-hosted infrastructure still has operator costs. Approval of a real provider's terms and live integration remains a prerequisite to enabling live search.

## Device permission and accuracy

There is no geolocation call on page load. **Use my current location** first explains that it works best at the business; **Continue and ask permission** then makes one browser request. It requests a fresh result with high accuracy preferred and a 12-second timeout. Permission denied, unavailable location, timeout, unsupported browser and insecure context all have plain-language fallbacks. Secure context/browser permission requirements follow the [browser Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition).

Accuracy above 100 metres, negative or unknown accuracy displays a stronger warning. Even a precise result remains a suggestion requiring pin review and confirmation. Late callbacks after Cancel, changing method or unmounting cannot change the editor. Browser accuracy is an estimate, not a guarantee of business position. Device location is never collected for workers or residents by this feature.

## Privacy, compatibility and APIs

- Reuses authenticated owner `GET`, `PUT`, `DELETE /api/businesses/{id}/location`, unchanged payload `{latitude, longitude, locationPublic}`.
- Preserves V13, stored coordinates, addresses, ownership checks and public response contracts. No migration or backend source change was necessary.
- Existing published consent stays checked. Moving a published point while keeping sharing enabled additionally requires **I confirm customers may see this changed location** before progressing to Save. Another point edit invalidates that confirmation.
- Private pins stay redacted in public business detail/list responses and Explore. Existing public business markers, pagination and worker privacy remain unchanged.
- No account type, Cloudinary, messaging, jobs or worker privacy changes. No push, merge or deployment.

## Accessibility and screenshots

The flow uses the existing plum, cream and marigold design. Primary actions have text labels, 48px minimum height and visible focus outlines. Body text is 16px; headings describe the current step. Focus moves to the step heading and returns to the opening control after Save/Cancel. Feedback uses status/alert semantics. The selected plum-on-cream color pair has a calculated contrast ratio of 14.66:1. Browser assertions check heading focus, a 48px placement action, no horizontal overflow at 375/1440px, and a complete keyboard placement-to-save journey without opening Advanced. The map has a named keyboard-focusable region and numerical-entry-free keyboard placement; advanced entry is still available. Mobile controls stack, checkboxes have associated labels and progress uses the current step semantics.

Screenshots below use local QA tile imagery and controlled place/device data. They demonstrate interface behavior, not live geography or production provider availability. Card screenshots omit the fixed application chrome to keep the complete editor visible.

- [Mobile pin placement](business-location-ux-sprint-2-1/guided-map-375.png)
- [Mobile privacy choice](business-location-ux-sprint-2-1/guided-privacy-375.png)
- [Desktop pin placement](business-location-ux-sprint-2-1/guided-map-1440.png)
- [Desktop privacy choice](business-location-ux-sprint-2-1/guided-privacy-1440.png)

## Validation

- Full frontend suite: **338 tests in 48 files passed** (`npm test --prefix frontend -- --maxWorkers=1`).
- Relevant backend suite: **78 tests passed**, zero failures/errors (`BusinessLocationTest`, `BusinessControllerTest`, `BusinessServiceTest`, `WorkerProfileControllerTest`). Backend tests use their existing isolated H2 test profile, not the development database.
- ESLint and production build passed. Whitespace checks passed.
- **47 unique browser cases passed**, across sequential bounded runs:

| Browser coverage | Passed |
| --- | ---: |
| Controlled guided UX: search/keyboard placement at 375/1440px, device success/low accuracy/denial/unavailable/timeout, changed-public-pin consent/Cancel, unavailable search | 9 |
| Real owner location CRUD, private/public responses, saved-pin reload, constraints and JWT ownership (desktop/mobile) | 4 |
| Existing public marketplace map, pagination, missing coordinates, tile failures and worker privacy | 6 |
| Existing real marketplace journeys: reviews, worker profiles/messages, jobs/applications, moderation, registration, business editing, directory and safe avatar endpoints (desktop/mobile) | 18 |
| Existing fixture UI: all routes at 375/768/1280/1440px, navigation, keyboard/focus, retries/reduced motion, reviews and avatar controls | 10 |
| **Total** | **47** |

The two search-to-map UX cases were rerun after correcting ambiguous test selectors; all nine unique guided cases passed. A long-lived orchestration wrapper expired after the first small-screen UI run had reported both cases passing; both were rerun in a fresh bounded process and recorded exit code 0. The remaining eight UI cases also recorded exit code 0. No application failure remains. The four committed screenshots were visually inspected. The temporary fixture frontend was stopped after the final successful run.

Browser checks run sequentially to bound local memory use. Real API journeys use the existing guarded PostgreSQL QA database at `127.0.0.1:55432/kasicircle_qa`; the database identity/isolation marker is verified before Flyway or SQL. Constraint probes target newly created QA-owned rows inside rolled-back transactions. No business records are deleted. After real-API checks, a guarded read found **0 businesses with coordinates/public location** and **13 successful Flyway migrations**. The QA PostgreSQL process started for this sprint was then stopped; the development database was not used. Default marketplace avatar checks run with Cloudinary credentials blank and verify safe rejection before provider I/O. No live geocoding is called.

Reproduction commands (from `frontend`, with the existing ignored isolated-QA environment configured and QA PostgreSQL running):

```bash
node node_modules/@playwright/test/cli.js test --config=playwright.location-ux.config.js
E2E_CHROME_PATH=/usr/bin/google-chrome node node_modules/@playwright/test/cli.js test --config=playwright.location.config.js --project=desktop
E2E_CHROME_PATH=/usr/bin/google-chrome node node_modules/@playwright/test/cli.js test --config=playwright.location.config.js --project=mobile
node node_modules/@playwright/test/cli.js test --config=playwright.map.config.js
JAVA_TOOL_OPTIONS=-Xmx384m E2E_CHROME_PATH=/usr/bin/google-chrome node node_modules/@playwright/test/cli.js test --project=desktop
JAVA_TOOL_OPTIONS=-Xmx384m E2E_CHROME_PATH=/usr/bin/google-chrome node node_modules/@playwright/test/cli.js test --project=mobile
```

For the existing ten fixture UI cases, start Vite on port 5174 with `VITE_API_BASE_URL=http://127.0.0.1:5174`, then run `playwright.visual.config.js`. The run was bounded into the 375/768px route cases and the remaining cases. Test traces and session artifacts stay ignored; only the four controlled card screenshots are committed.

## Local commits

- `e293587` — guided editor, optional search/device adapters, accessible map placement, styles and frontend tests.
- `f78be8c` — controlled guided-location browser cases, updated real QA location journey and four reviewed screenshots. The final documentation commit hash is supplied in the completion reply.

## Files

- `frontend/src/components/BusinessLocationEditor.jsx` and `.test.jsx`
- `frontend/src/components/BusinessLocationPicker.jsx`
- `frontend/src/components/BusinessPlaceSearch.jsx` and `.test.jsx`
- `frontend/src/services/placeSearch.js`, `deviceLocation.js`, `locationGuidance.test.js`
- `frontend/src/styles/business-location.css`
- `frontend/e2e/location.spec.js`, `location-ux.spec.js`
- `frontend/playwright.location-ux.config.js`
- This report and four screenshot artifacts in `docs/business-location-ux-sprint-2-1/`

## Remaining limitations

Live place search awaits an approved operator-owned same-origin proxy and provider setup. Production map tiles still need the existing approved tile URL and attribution configuration. Neither live external geocoding nor real device GPS accuracy was tested: automated checks use controlled fixtures. Keyboard controls, labels, focus, touch sizes and responsive layouts are checked, but a screen-reader/device user study with older adults was not conducted. Owner review remains necessary, especially for imprecise device suggestions or nearby landmark results.
