# Business location search repair

Local `Feature/Authentication`, based on `11c8f0e`. Earlier unpublished work is preserved. This repair keeps V13, location storage and the owner location API unchanged.

## Root cause and input repair

`BusinessPlaceSearch.jsx` previously rendered `disabled={!config.enabled || disabled}` on its search input. `placeSearchConfig()` returned false unless the old frontend Photon-proxy flags, URL and attribution were all configured. Therefore the browser disabled the field before it could generate input events. This was the exact cause of Daveyton/Benoni not appearing.

The React `value={query}`, `onChange`, state update and parent rendering were already connected correctly. There was no `readOnly` attribute. The parent supplies a transient busy/locating flag; it was the additional provider check on the native input that blocked typing in the normal unconfigured case. The flex layout has no overlay or pointer-events rule blocking the input.

The text input now remains editable while availability is loading, absent or failed, and while other actions are busy. Only submitting a search and selecting results are gated. Edits immediately update the controlled value, cancel stale requests and clear old results. Enter explicitly submits only when online search is available. Typing alone never requests Geoapify.

The old `VITE_PLACE_SEARCH_*` flags are no longer used. Availability comes from the actual Spring Boot configuration, so frontend and backend configuration cannot silently disagree.

## Backend configuration and contract

Configure **`GEOAPIFY_API_KEY` in the backend process environment**, then restart Spring Boot. Obtain a project key through the operator's Geoapify account. Do not put it in frontend environment variables, source files or browser configuration. No key was provisioned, copied or changed by this repair. With a missing/blank key, online lookup remains unavailable and the input still accepts text.

The frontend calls the existing API base (`VITE_API_BASE_URL`, matching the rest of the app):

- `GET /api/places/status` → `{ "enabled": true | false }`; local configuration check only, no provider call.
- `GET /api/places/search?q=Daveyton` → `{ "places": [{ "name": "…", "formattedAddress": "…", "latitude": …, "longitude": …, "attribution": "…" }] }`.

Both endpoints require a signed-in BUSINESS account. Workers, residents, missing accounts and unauthenticated callers cannot spend provider credits. Existing default Spring Security authentication covers `/api/places/**`; the controller additionally checks the current account type. Search does not write any business record or collect worker/resident locations.

The server calls only `https://api.geoapify.com/v1/geocode/search`, with submitted text, `filter=countrycode:za`, `limit=5`, `format=json` and the server key. It forwards no JWT/cookies. Neither the key nor raw provider errors are returned. Queries are trimmed and restricted to 3–120 characters; control characters are rejected. URI query values are encoded. There is no autocomplete, background lookup or Nominatim request.

Transport uses a 2-second connection timeout and 4-second request/read timeout with redirects disabled. Response reads are capped at 64 KiB. Only five valid numeric-coordinate South African entries are returned; labels/credit strings are bounded and rendered as text, never HTML. Provider status errors, malformed/oversized responses and transport failures become a friendly 503. Empty results remain empty. Provider/local quota exhaustion returns 429 with a wait-and-retry message. Disabled configuration returns 503 without calling the provider. Successful status/search responses use `Cache-Control: no-store`; the client also requests `no-store` and follows no redirects.

Rate limiting is synchronized and local to each application process: at most **2 outgoing searches per fixed second globally**, **10 per account per fixed minute**, with expired-account entries discarded and a 4096-account bound. Requests rejected by validation, missing configuration or quota checks never reach Geoapify. Multiple application replicas require a shared gateway/distributed quota limit before scaling; process-local limits are not an account-wide billing cap. There are no automatic provider retries or result caches.

## Provider terms, attribution and cost

The proxy follows Geoapify's [Search API contract and country filtering](https://apidocs.geoapify.com/docs/geocoding/). Geoapify requires provider/data-source credit and permits result storage subject to retaining the relevant attribution ([provider FAQ](https://www.geoapify.com/geocoding-api/), [geocoding tool/data credits](https://www.geoapify.com/tools/geocoding-online/)).

The UI displays a follow-link to Geoapify and data credits for OpenStreetMap contributors, OpenAddresses, GeoNames, Who's On First and Wikipedia. Bounded per-result attribution from the response is also shown beside results and the selected approximate area. Shared credits remain visible in pin placement/review and public business map views so retaining an owner-confirmed point does not drop the credit. No provider URLs or HTML from responses are rendered.

No subscription or paid plan is created or upgraded. The account owner must choose a plan and set provider-side credit/billing controls. Quotas, credits and prices depend on that plan; consult the current [Geoapify pricing page](https://www.geoapify.com/pricing/). The application limiter does not replace the provider's account quota. Queries and the backend server's request metadata reach Geoapify only on explicit Search; browser geolocation and JWTs are not sent to it. Query/result data is transient in this client and is not stored by this proxy; upstream retention and infrastructure access logs remain operator responsibilities. Keep HTTP wire/request-URI logging disabled for provider calls because the provider requires a key in its query string.

## Owner journey and privacy

Type Daveyton → Search/Enter → choose a matching named/addressed result → map moves to that approximate area, **without placing/saving/publishing a precise pin** → owner places/moves the pin → confirms → reviews → chooses visibility → final Save. Existing published-pin replacement confirmation remains required. Cancel leaves the saved point and consent unchanged. Search has no write endpoint. Existing map/device/Advanced methods remain independent of provider availability.

## Validation

| Check | Result |
| --- | --- |
| Full frontend, 48 files / 338 cases | 337 passed initially; one unchanged Home test hit its 5-second timeout during concurrent CPU load. The entire Home file then passed all 10 tests in isolation in 6.39 seconds, with no code/assertion changes. All 338 cases verified after that rerun. |
| Existing relevant backend location/business/worker tests | 78 passed |
| New proxy service/controller tests | 11 passed: 8 service cases and 3 authorization/controller cases; 89 distinct backend cases total |
| Controlled location UX browser tests | 12 passed |
| Real QA owner-location/proxy/auth/privacy browser tests | 4 passed, desktop and mobile |
| Existing public marketplace-map browser regressions | 6 passed, including mobile/tablet/desktop discovery, pagination, absent coordinates, tile failures and worker privacy |
| Explicit touch/input/screenshot rerun | 4 previously covered UX cases passed again at 375/1440px |
| ESLint / production frontend build / backend packaging / whitespace | Passed |

There are **22 distinct passing browser cases**, plus the four evidence reruns. One initial mobile mouse-drag attempt missed the marker because opening Advanced had scrolled it outside the viewport after attribution was added. The test now explicitly scrolls the marker into view before measuring/dragging; the entire mobile QA pair passed on rerun. No application failure remains and no unrelated Home implementation or assertion was changed.

Provider HTTP calls are mocked by `MockRestServiceServer`; browser search/device/tile responses are controlled local fixtures. No automated test calls live Geoapify or Nominatim. Real write journeys use only guarded isolated PostgreSQL QA data; backend controller/service tests use their existing isolated H2 profile. A final guarded QA read found **0 businesses with stored/public location coordinates** and **13 successful migrations**. All temporary QA backend, database and fixture listeners were stopped. Cloudinary settings/functionality and their existing test configuration were retained; the new Geoapify key is explicitly blanked in browser QA to prevent provider I/O.

Commands executed from the repository root (browser CLI commands run from `frontend`):

```bash
npm test --prefix frontend -- --maxWorkers=1
npm test --prefix frontend -- --maxWorkers=1 src/pages/Home.test.jsx
npm run lint --prefix frontend
npm run build --prefix frontend
MAVEN_OPTS=-Xmx256m mvn -f backend/pom.xml -Dtest=PlaceSearchServiceTest,PlaceSearchControllerTest,BusinessLocationTest,BusinessControllerTest,BusinessServiceTest,WorkerProfileControllerTest test
MAVEN_OPTS=-Xmx256m mvn -f backend/pom.xml -Dtest=PlaceSearchServiceTest test
MAVEN_OPTS=-Xmx256m mvn -f backend/pom.xml -DskipTests package
```

Browser runs use `playwright.location-ux.config.js` (12 cases), `playwright.location.config.js --project=desktop` and `--project=mobile` (2 each), and `playwright.map.config.js` (6). Real QA runs use the existing ignored QA environment and database isolation preflight, with `JAVA_TOOL_OPTIONS=-Xmx384m`. Tests are not pointed at the development database.

## Screenshot evidence

These controlled card captures omit fixed application chrome; they show typed text and real UI state, not live Geoapify acceptance. All four were visually inspected.

- [Daveyton typed, configured fixture — mobile](business-location-search-repair/search-input-375.png)
- [Daveyton typed, configured fixture — desktop](business-location-search-repair/search-input-1440.png)
- [Benoni edited, no provider, manual alternatives — mobile](business-location-search-repair/unconfigured-input-375.png)
- [Benoni edited, no provider, manual alternatives — desktop](business-location-search-repair/unconfigured-input-1440.png)

## Files changed

- `backend/src/main/java/com/kasicircle/backend/places/PlaceSearchService.java`
- `backend/src/main/java/com/kasicircle/backend/places/PlaceSearchController.java`
- `backend/src/test/java/com/kasicircle/backend/places/PlaceSearchServiceTest.java`
- `backend/src/test/java/com/kasicircle/backend/places/PlaceSearchControllerTest.java`
- `frontend/src/services/placeSearch.js` and `locationGuidance.test.js`
- `frontend/src/components/BusinessPlaceSearch.jsx` and `.test.jsx`
- `frontend/src/components/PlaceAttribution.jsx`
- `frontend/src/components/BusinessLocationEditor.jsx` and `.test.jsx`
- `frontend/src/components/BusinessLocationPicker.jsx`
- `frontend/src/components/MarketplaceMap.jsx`
- `frontend/e2e/location-ux.spec.js`, `location.spec.js`
- `frontend/playwright.location-ux.config.js`, `playwright.config.js` (the QA backend explicitly blanks the Geoapify key)
- This report and controlled screenshots under `docs/business-location-search-repair/`.

## Local commits and limits

- `00f76af` — backend Geoapify proxy, authentication/account checks and mocked provider/quota/response tests.
- `1c291b8` — editable field, runtime backend availability, submitted searches, data attribution, frontend/browser tests and screenshot evidence.

The final report commit hash is supplied in the completion reply. No push, merge, deployment, Cloudinary change, migration or account-type change is part of this repair. Live provider acceptance with a real project key remains untested; missing configuration is explicitly supported. Device/touch QA uses Chromium emulation, not a physical handset or native mobile keyboard.
