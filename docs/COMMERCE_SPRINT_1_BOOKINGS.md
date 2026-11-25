# Commerce Sprint 1 — Service listings and bookings

## Implementation

Business owners and independent workers can publish, edit, hide and reactivate services using categories from their existing listings or profiles. Each service has a duration and fixed, starting or quote-required ZAR pricing. Customers can request work from either provider type, track requests and respond to proposed times and prices. Booking notifications open the corresponding private booking page.

A fixed-price request can be confirmed directly by the provider. Starting-price and quote-required requests need a provider proposal and customer acceptance. The provider’s proposal commits them to its terms if the customer accepts and the slot is still available. Both parties can cancel an open or accepted booking before work starts. To change the terms of an accepted booking, cancel and make a new request. Providers start work at or after the scheduled time and complete it after starting. Open requests and proposals expire at their applicable proposed or preferred time.

The booking keeps the original requested time and snapshots of the service name, parties’ display names, estimated duration and pricing model. Listing edits do not alter existing booking terms. Confirmed slots include the estimated duration. PostgreSQL transaction locks serialize confirmations per provider and make retries with the same customer and request key return the original booking. A revision check prevents accepting a superseded proposal. Notifications and the associated booking writes share a transaction.

All booking times are stored as instants. People enter and view times in South African time. The payment label indicates payment is handled outside KasiCircle. The app records no online or external payment confirmation.

## Migration

[V14](../backend/src/main/resources/db/migration/V14__create_services_and_bookings.sql) adds the service and booking tables, foreign keys, indexes and booking notification type. Deleting a provider listing removes its services from public discovery while retaining booking records for participants. The migration creates no service listings for existing providers.

## API and account permissions

| Method and resource | Access and behavior |
| --- | --- |
| `GET /api/services?providerType=BUSINESS\|WORKER&providerId={id}` | Public, paginated active services for a provider profile ID |
| `GET /api/services/{id}` | Public, active service detail |
| `GET /api/services/mine` | Current provider’s services, including hidden ones |
| `POST /api/services` | Business or worker with an existing provider profile. Ownership comes from the authenticated account |
| `PUT /api/services/{id}`, `DELETE /api/services/{id}` | Only the provider who owns the service. DELETE hides the service |
| `POST /api/bookings` | Authenticated customer booking another account’s active service. Supply a UUID `requestKey` and reuse it if retrying the same submission |
| `GET /api/bookings/my`, `GET /api/bookings/provider` | Paginated customer history or the current business/worker’s incoming bookings |
| `GET /api/bookings/{id}` | The two participants and administrators with the existing ADMIN role |
| `PATCH /api/bookings/{id}/status` | Participant only. The body includes an action and the displayed revision. Proposal actions also include the time and total price |

## Frontend

| Entry point | Screen or component |
| --- | --- |
| `/businesses/:id` and `/workers/:id` | Shared `ProviderServices` cards |
| `/services/manage` | `ManageServices` with a provider category selector and public visibility control |
| `/services/:id/book` | `RequestBooking` with local time, work description, and service area |
| `/bookings` and `/bookings/incoming` | `Bookings` list and history |
| `/bookings/:id` | `BookingDetail` and role-specific actions |
| `/profile` and `/notifications` | Booking navigation and links to individual updates |

## Screenshots

The browser tests use QA accounts and fixtures. The screenshots focus on the booking screens.

- [Desktop provider proposal](commerce-sprint-1/desktop-provider-proposal.png)
- [Mobile confirmed booking](commerce-sprint-1/mobile-confirmed-booking.png)

## Test evidence

The real API tests first verified the PostgreSQL identity marker on the dedicated loopback QA database `kasicircle_qa`. The commerce tests use uniquely generated accounts and update only their own QA booking rows to exercise expiration and work-start timing. The pre-existing backend suites use their configured in-memory test database.

| Check | Result |
| --- | --- |
| Maven backend unit and Spring integration tests | 304 passed with the local Mockito Java agent explicitly attached. The additional malformed-parameter controller test passed in a focused run. |
| Vitest frontend unit and component tests | 342 passed across 50 files |
| ESLint | Passed |
| Vite production build | Passed |
| Playwright and PostgreSQL | 31 passed across desktop, mobile and responsive projects. One API-only case ran on desktop and was intentionally skipped on mobile. |

An initial desktop run timed out during login. The desktop booking journey and subsequent full regression passed. The final packaged backend passed the three focused commerce checks. PostgreSQL reports migration V14 successful.

Playwright checks use the existing real-backend configuration in `frontend/playwright.config.js`. To rerun, verify the QA database with `npm run test:e2e:status`, package the backend, then run `npm run test:e2e` in `frontend`. To regenerate the two screenshots, set `COMMERCE_SCREENSHOT_DIR=../docs/commerce-sprint-1` when running the commerce spec.

## Files and commits

The implementation touches the backend commerce package, V14, Spring Security and notification types. Frontend changes cover commerce components and pages, profile and notification integrations, the API client, and Playwright browser fixtures. Documentation includes this report, screenshots and the four-sprint roadmap.

Implementation commit `a8b383141511b86232b27e16e1c8a62fe294de3c`.

## Known limitations and production requirements

- Availability is based on the confirmed schedule and estimated duration. Providers manage working hours, travel and overruns themselves. Open requests do not reserve time.
- Expiry is evaluated when bookings are read or changed. There is no expiration reminder or automated cancellation notification.
- Booking retries preserve the request key while the form is open. An interrupted client can also check My bookings before sending another request.
- Before a production rollout, validate V14 through the normal staging migration and deployment process. Future payment work requires sandbox credentials, verified settlement eligibility and an approved fee and refund policy.
