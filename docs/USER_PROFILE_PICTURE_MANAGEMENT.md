# User profile picture management

Date: 15 November 2026 (Africa/Johannesburg). Branch: `Feature/Authentication`.

## Scope and architecture

Adds personal account avatars to the existing application for RESIDENT, BUSINESS and WORKER accounts. Uses the current local branch and preserves unpublished changes. Existing profile editing, account management, JWT authentication and business galleries remain in place. No business owner's avatar is used as a business logo.

The existing `ImageStorageService` / Cloudinary implementation is reused. Public worker DTOs expose only the avatar URL in addition to their existing public fields; private account fields and Cloudinary public IDs are excluded. Worker cards, worker detail and the signed-in account menu consume the shared Avatar component.

## Migration

`backend/src/main/resources/db/migration/V12__add_user_profile_images.sql` is the next migration after V11. It adds nullable `users.profile_image_url VARCHAR(500)` and `users.profile_image_public_id VARCHAR(255)`. Existing accounts need no image and no unrelated account fields are migrated. PostgreSQL stores references only, never image bytes.

The migration also creates `user_profile_image_cleanup`, a durable deletion outbox with UUID identity, unique public ID, creation timestamp and attempt count. This makes clearing/replacing references and scheduling remote cleanup atomic.

## API

All self-service endpoints use the existing JWT security chain and authenticated principal. No target account ID or client public ID controls mutations.

| Method | Endpoint | Request | Success |
| --- | --- | --- | --- |
| POST | `/api/users/me/profile-image` | multipart/form-data, part `file` | 200, safe updated UserProfileResponse |
| DELETE | `/api/users/me/profile-image` | no body | 200, updated profile with null image URL; idempotent |
| GET | `/api/users/me` | no body | Existing response plus nullable `profileImageUrl` |

Invalid/empty/malformed/oversized files use the existing 400 ApiErrorResponse convention; unauthenticated requests return 401. Upload provider failure returns a generic 503. Persistence failure returns a generic 500. No SDK exception details, stack traces or secrets are returned for avatar operations.

## Validation and storage

Server validation enforces 5 MiB and JPEG, PNG or WebP. It checks supported MIME declarations against the actual ImageIO reader format, validates file framing and fully decodes pixels. TwelveMonkeys supplies WebP decoding. Truncated images, mismatches and decoder warnings are rejected. Decoded images are bounded to 4096 pixels per side and 16 megapixels to limit memory use. Filenames are never used as paths or storage identifiers.

Assets use `kasicircle/account-avatars/<server-generated UUID>`, separate from business gallery folders. Returned IDs must match that namespace and UUID shape. Storage credentials remain on the backend. No existing upload rate-limit infrastructure was found; a new distributed limiter was outside this addition. Existing request/file limits remain enforced.

Replacement uploads and validates first, then locks the current account row and commits the new reference and old-image cleanup job together. `@DynamicUpdate` limits stale unrelated-field overwrites. On failed persistence, the new image is removed only after checking that it is not an active account reference. Failed orphan deletion is queued when the database is available. An uncertain commit outcome retains the asset for reconciliation rather than risking deletion of a current image.

Removal atomically clears the reference and queues the former image. The cleanup worker runs after commit, checks avatar namespace and current references, and processes up to 20 jobs per minute by default. Remote failures retain the job and increment attempts. Avatar destruction requests CDN invalidation; remote deletion and CDN expiry are eventual. Business image deletion behavior is preserved. Safe warnings omit raw provider exception messages.

If persistence status cannot be checked and a cleanup job cannot be stored, manual orphan reconciliation remains necessary. Multi-instance scheduling may issue duplicate idempotent destroy requests; successful or already-absent assets are accepted.

## Frontend

The existing Profile summary includes a circular picture, initials/broken-image fallback, accessible camera button and file input, local object-URL preview, Save/Cancel, loading states, notices and removal. Preview URLs are revoked. Successful mutations update AuthContext immediately from the committed response, then refresh `/api/users/me`. Established localStorage caching stores profile metadata and the existing JWT, never image bytes or Cloudinary credentials.

Screenshots and validation results are recorded below. Browser avatar success screenshots use explicit mocked API responses and a temporary test image; they are not evidence of live Cloudinary acceptance.

## Safety and acceptance

No live Cloudinary upload or deletion is authorized until rotation/revocation of previously exposed credentials is confirmed. Rotation could not be confirmed, so that acceptance step remains pending. Automated image operations use mocks. Real browser backend checks use blank Cloudinary credentials and assert the storage-unavailable path.

Database browser fixtures and Flyway verification target only the guarded QA cluster `127.0.0.1:55432/kasicircle_qa`, verified by database name, port and isolation marker. The QA backend successfully applied V12: the guarded PostgreSQL status check reports 12 successful Flyway migrations. The development database is not migrated or reset by this sprint. Existing development database review-table permission issues remain separate from isolated QA acceptance.

No push, deployment or Sprint 17 work is included. Unrelated local marketplace verification documents are excluded from feature commits.

## Files created or modified

- `backend/pom.xml`
- `backend/src/main/java/com/kasicircle/backend/businesses/storage/CloudinaryStorageServiceImpl.java`
- `backend/src/main/java/com/kasicircle/backend/shared/exception/GlobalExceptionHandler.java`
- `backend/src/main/java/com/kasicircle/backend/users/dto/UserProfileResponse.java`
- `backend/src/main/java/com/kasicircle/backend/users/entity/User.java`
- `backend/src/main/java/com/kasicircle/backend/users/images/ProfileImageCleanup.java`
- `backend/src/main/java/com/kasicircle/backend/users/images/ProfileImageCleanupRepository.java`
- `backend/src/main/java/com/kasicircle/backend/users/images/ProfileImageCleanupWorker.java`
- `backend/src/main/java/com/kasicircle/backend/users/images/ProfileImageController.java`
- `backend/src/main/java/com/kasicircle/backend/users/images/ProfileImageService.java`
- `backend/src/main/java/com/kasicircle/backend/users/images/ProfileImageValidator.java`
- `backend/src/main/java/com/kasicircle/backend/users/repository/UserRepository.java`
- `backend/src/main/java/com/kasicircle/backend/users/service/UserServiceImpl.java`
- `backend/src/main/java/com/kasicircle/backend/workers/dto/WorkerProfileResponse.java`
- `backend/src/main/java/com/kasicircle/backend/workers/service/WorkerProfileServiceImpl.java`
- `backend/src/main/resources/db/migration/V12__add_user_profile_images.sql`
- `backend/src/test/java/com/kasicircle/backend/businesses/storage/CloudinaryStorageServiceImplTest.java`
- `backend/src/test/java/com/kasicircle/backend/users/images/ProfileImageIntegrationTest.java`
- `backend/src/test/resources/application-test.properties`
- `backend/src/test/resources/images/avatar.webp`
- `frontend/e2e/marketplace.spec.js`
- `frontend/e2e/ui.spec.js`
- `frontend/src/components/AppShell.jsx`
- `frontend/src/components/Avatar.jsx`
- `frontend/src/components/ProfileImageEditor.jsx`
- `frontend/src/components/ProfileImageEditor.test.jsx`
- `frontend/src/components/ProviderCard.jsx`
- `frontend/src/components/index.jsx`
- `frontend/src/components/ui.jsx`
- `frontend/src/contexts/AuthContext.jsx`
- `frontend/src/contexts/AuthContext.test.jsx`
- `frontend/src/models/provider.js`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/pages/WorkerDetail.jsx`
- `frontend/src/services/api.js`
- `frontend/src/services/profileImageApi.test.js`
- `frontend/src/styles/profile-image.css`
- `docs/USER_PROFILE_PICTURE_MANAGEMENT.md` (this report)

## Validation results

- Full backend: `mvn package` — **269 passed, 0 failures, 0 errors, 0 skipped**; includes **26 ProfileImageIntegrationTest cases**. H2 database and mocked Cloudinary storage; covers all account types, actual JPEG/PNG/WebP decoding, malformed/oversized/spoofed input, unauthorized requests, ownership, persistence rollback, orphan cleanup, deletion retries, concurrency, public worker privacy and JWT login persistence.
- Full frontend: `npm test -- --maxWorkers=1` — **279 passed across 41 files**, exit 0. Includes fallback/preview/cancel/upload/error/removal/loading tests, shared avatar updates, AuthContext refresh/cache/session tests and multipart API handling.
- Responsive browser: `npx playwright test --config=playwright.visual.config.js --output=test-results/avatar-ui` — **10 passed**; all routes at 375/768/1280/1440px, keyboard/mobile controls, loading/retry and avatar lifecycle at 375/1440px. An earlier competing run was interrupted after a timeout under resource pressure; this standalone full run passed.
- Real-backend browser: `npx playwright test --project=desktop --project=mobile --output=test-results/avatar-real` — **18 passed** against isolated PostgreSQL QA; all existing marketplace/review/worker/job/messaging/moderation/authentication journeys retained. New avatar cases exercise all account types, unauthenticated rejection, invalid content rejection, null-image compatibility, idempotent removal and generic 503 with storage disabled. Successful remote upload is covered with mocked storage in backend/frontend tests, not claimed as a live provider result.
- ESLint: `npm run lint` — passed.
- Production frontend: `npm run build` — passed.

## Local commits

- `f92b209` — backend storage, V12 migration, safe cleanup and tests.
- `080ec80` — frontend editor, shared avatars, AuthContext refresh and tests.

## Screenshots

Temporary WebP image and mocked profile API responses; no real account photo or live provider operation.

- [Preview at 375px](profile-images/avatar-preview-375.png)
- [Saved at 375px](profile-images/avatar-saved-375.png)
- [Preview at 1440px](profile-images/avatar-preview-1440.png)
- [Saved at 1440px](profile-images/avatar-saved-1440.png)

Screenshots were visually inspected at mobile and desktop sizes. They show the existing plum/cream/marigold layout, circular editor, preview controls and saved-image removal action. The solid plum avatar is the deliberately minimal temporary WebP fixture.

## Remaining acceptance blockers

- Live Cloudinary upload/replacement/removal and CDN invalidation must be accepted with a controlled temporary-image account after confirmation that exposed credentials were rotated or revoked. No live provider writes were attempted.
- V12 was applied and verified only in isolated QA. Apply normal Flyway migrations when launching the updated backend in another environment; no development database migration, reset or fixture write was performed here.
- Existing development database business-review grants remain an unrelated local integration issue, documented separately in the pre-existing untracked marketplace verification report.

The backend and frontend commits above contain the implementation. Browser tests, this report and the four screenshot artifacts form the final focused local verification commit; its hash is supplied in the completion reply. No push or deployment occurred. The temporary QA PostgreSQL server was stopped after verification, preserving its database files.
