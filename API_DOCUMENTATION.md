# KasiCircle API Documentation

Base URL:

```text
http://localhost:8081
```

## Authentication endpoints

### Register a user

- Method: POST
- URL: /api/auth/register
- Auth required: No

Request body:

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "phoneNumber": "+27821112222",
  "password": "Password123!",
  "accountType": "BUSINESS"
}
```

Supported `accountType` values: `RESIDENT`, `WORKER`, `BUSINESS`. Defaults to `RESIDENT` if omitted.

Responses:
- 201 Created on success
- 400 Bad Request for validation errors
- 409 Conflict when the email already exists

### Login

- Method: POST
- URL: /api/auth/login
- Auth required: No

Request body:

```json
{
  "email": "jane.doe@example.com",
  "password": "Password123!"
}
```

Successful response:

```json
{
  "token": "eyJ..."
}
```

## User endpoints

### Get current user

- Method: GET
- URL: /api/users/me
- Auth required: Yes

Responses:
- 200 OK with the authenticated user's profile
- 401 Unauthorized for missing or invalid JWT
- 404 Not Found if the user no longer exists

### Update current user

- Method: PUT
- URL: /api/users/me
- Auth required: Yes

Request body:

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+27829998888"
}
```

Responses:
- 200 OK with updated profile
- 400 Bad Request for validation issues
- 401 Unauthorized when JWT is missing or invalid

### Change password

- Method: PUT
- URL: /api/users/change-password
- Auth required: Yes

Request body:

```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```

Responses:
- 200 OK on success
- 400 Bad Request for validation or incorrect current password
- 401 Unauthorized when JWT is missing or invalid

### Get businesses for current user

- Method: GET
- URL: /api/users/me/businesses
- Auth required: Yes

Supports pagination parameters such as page and size.

## Business endpoints

Public business endpoints are open to anonymous visitors and users of all account types (`RESIDENT`, `WORKER`, `BUSINESS`).
Listing management endpoints (`POST`, `PUT`, `DELETE`) require authentication and are restricted to users with `accountType = BUSINESS`.

### Create business

- Method: POST
- URL: /api/businesses
- Auth required: Yes
- Authorization: Authenticated user with `accountType = BUSINESS`

Request body:

```json
{
  "name": "Corner Cafe",
  "description": "Local coffee shop in the township.",
  "phoneNumber": "+27123456789",
  "email": "contact@cornercafe.co.za",
  "category": "Food & Beverage",
  "address": "123 Main Road",
  "city": "Johannesburg",
  "province": "Gauteng"
}
```

Responses:
- 201 Created with created business details
- 400 Bad Request for validation errors
- 401 Unauthorized when JWT is missing or invalid
- 403 Forbidden when authenticated user is not a BUSINESS account (e.g. RESIDENT or WORKER)
- 409 Conflict if the BUSINESS account already has an existing business listing (single listing limit)

### Get all businesses

- Method: GET
- URL: /api/businesses
- Auth required: No (Public)
- Authorization: None (Accessible to anonymous visitors and authenticated users)

Query parameters:
- `page` (optional, default: 0): Zero-based page index
- `size` (optional, default: 20): Page size
- `sort` (optional): Sort fields and direction (e.g. `createdAt,desc`)
- `search` (optional): Substring search matching business name (case-insensitive)
- `category` (optional): Exact category filter (e.g. `Food & Beverage`, `Automotive`, `Retail`)
- `city` (optional): Case-insensitive filter matching township or city (e.g. `Soweto`, `Johannesburg`)

Responses:
- 200 OK with paginated list of public business summaries

### Get business by id

- Method: GET
- URL: /api/businesses/{id}
- Auth required: No (Public)
- Authorization: None (Accessible to anonymous visitors and authenticated users)

Path parameters:
- `id` (UUID, required): Unique identifier of the business

Sample response (200 OK):

```json
{
  "id": "7f6aba4b-643f-41ec-a509-94b8f4381404",
  "name": "Kasi Fresh Cafe",
  "description": "Serving delicious township meals and refreshments daily.",
  "phoneNumber": "+27821112222",
  "email": "info@kasifresh.co.za",
  "category": "Food & Beverage",
  "address": "45 Vilakazi Street",
  "city": "Soweto",
  "province": "Gauteng",
  "ownerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-10-01T10:00:00Z",
  "updatedAt": "2026-10-01T10:00:00Z",
  "coverImageUrl": "https://res.cloudinary.com/kasicircle/image/upload/v1/kasicircle/businesses/7f6aba4b-643f-41ec-a509-94b8f4381404/sample.jpg"
}
```

Responses:
- 200 OK with business details (owner ID exposed safely without exposing sensitive credentials)
- 404 Not Found if the business does not exist

### Update business

- Method: PUT
- URL: /api/businesses/{id}
- Auth required: Yes
- Authorization: Business owner with `accountType = BUSINESS` only

Request body:

```json
{
  "name": "Updated Corner Cafe",
  "description": "Updated township cafe description.",
  "phoneNumber": "+27123456789",
  "email": "info@cornercafe.co.za",
  "category": "Food & Beverage",
  "address": "456 Market Street",
  "city": "Johannesburg",
  "province": "Gauteng"
}
```

Responses:
- 200 OK with updated business details
- 400 Bad Request for validation errors
- 401 Unauthorized when JWT is missing or invalid
- 403 Forbidden if the user is not a BUSINESS account or does not own the listing
- 404 Not Found if the business does not exist

### Delete business

- Method: DELETE
- URL: /api/businesses/{id}
- Auth required: Yes
- Authorization: Business owner with `accountType = BUSINESS` only

Responses:
- 204 No Content on successful deletion
- 401 Unauthorized when JWT is missing or invalid
- 403 Forbidden if the user is not a BUSINESS account or does not own the listing
- 404 Not Found if the business does not exist

## Business review endpoints

Reviews are public to read. Creating, updating, deleting, or retrieving the authenticated user's review requires a valid JWT. Each user may submit one review per business; the business owner cannot review their own business.

Review request bodies use a `rating` from 1 to 5 and an optional `comment` of up to 1000 characters:

```json
{
  "rating": 5,
  "comment": "Friendly service and excellent food."
}
```

Public review responses include the author's display name, but never their email address or phone number:

```json
{
  "id": "8e3b5e43-85b9-4a9f-9a1b-3fbb13854123",
  "businessId": "7f6aba4b-643f-41ec-a509-94b8f4381404",
  "rating": 5,
  "comment": "Friendly service and excellent food.",
  "authorName": "Jane D.",
  "createdAt": "2026-11-02T22:00:00Z",
  "updatedAt": "2026-11-02T22:00:00Z"
}
```

### List business reviews

- Method: GET
- URL: `/api/businesses/{businessId}/reviews`
- Auth required: No
- Pagination: `page` (default `0`), `size` (default `10`), and standard Spring `sort` parameters. Results default to newest first.

Returns a paginated list of review responses.

### Get a business rating summary

- Method: GET
- URL: `/api/businesses/{businessId}/reviews/summary`
- Auth required: No

Returns `businessId`, `averageRating` (rounded to two decimal places, or `0.0` without reviews), `totalReviews`, and `fiveStarCount` through `oneStarCount`.

### Get the authenticated user's review

- Method: GET
- URL: `/api/businesses/{businessId}/reviews/me`
- Auth required: Yes

Responses:
- 200 OK with the user's review
- 204 No Content if the user has not reviewed the business
- 401 Unauthorized when JWT is missing or invalid
- 404 Not Found if the business does not exist

### Create a business review

- Method: POST
- URL: `/api/businesses/{businessId}/reviews`
- Auth required: Yes

Responses:
- 201 Created with the created review
- 400 Bad Request for an invalid rating or comment
- 401 Unauthorized when JWT is missing or invalid
- 403 Forbidden if the authenticated user owns the business
- 404 Not Found if the business does not exist
- 409 Conflict if the user has already reviewed the business

### Update a business review

- Method: PUT
- URL: `/api/businesses/{businessId}/reviews/{reviewId}`
- Auth required: Yes
- Authorization: The review author only

Uses the same request body as review creation.

Responses:
- 200 OK with the updated review
- 400 Bad Request for an invalid rating or comment
- 401 Unauthorized when JWT is missing or invalid
- 403 Forbidden if the authenticated user is not the review author
- 404 Not Found if the business or review does not exist

### Delete a business review

- Method: DELETE
- URL: `/api/businesses/{businessId}/reviews/{reviewId}`
- Auth required: Yes
- Authorization: The review author or an ADMIN

Responses:
- 204 No Content on success
- 401 Unauthorized when JWT is missing or invalid
- 403 Forbidden if the authenticated user cannot delete the review
- 404 Not Found if the business or review does not exist

## Worker profile endpoints

Worker profile management is restricted to authenticated accounts with `accountType = WORKER`. Public worker profile responses intentionally omit email addresses and phone numbers.

A worker profile request uses the following JSON shape:

```json
{
  "headline": "Qualified Electrician",
  "bio": "Residential wiring and repairs.",
  "skills": ["Wiring", "Electrical repairs"],
  "serviceCategories": ["Electrical"],
  "city": "Soweto",
  "province": "Gauteng"
}
```

The headline is limited to 120 characters, bio to 2000, location fields to 100 each, and skills/categories to 20 entries of at most 60 characters each. Each WORKER account may have one profile.

### Search public worker profiles

- Method: GET
- URL: `/api/workers`
- Auth required: No
- Query parameters: `search` (name, headline, or bio), `category` (exact service category), `skill` (partial skill match), `city` (partial city match), `page` (default `0`), `size` (default `20`), and standard Spring `sort` parameters.

Returns paginated public worker profile responses.

### Get a public worker profile

- Method: GET
- URL: `/api/workers/{profileId}`
- Auth required: No

Responses:
- 200 OK with public profile fields and worker display name
- 404 Not Found if the profile does not exist

### Get the authenticated worker's profile

- Method: GET
- URL: `/api/workers/me`
- Auth required: Yes
- Authorization: `accountType = WORKER`

Responses:
- 200 OK with the worker's own profile
- 401 Unauthorized when JWT is missing or invalid
- 403 Forbidden for accounts other than WORKER
- 404 Not Found if no profile has been created

### Create the authenticated worker's profile

- Method: POST
- URL: `/api/workers/me`
- Auth required: Yes
- Authorization: `accountType = WORKER`

Responses:
- 201 Created with the profile
- 400 Bad Request for invalid fields
- 401 Unauthorized when JWT is missing or invalid
- 403 Forbidden for accounts other than WORKER
- 409 Conflict if the account already has a profile

### Update the authenticated worker's profile

- Method: PUT
- URL: `/api/workers/me`
- Auth required: Yes
- Authorization: `accountType = WORKER`; the profile is selected by the authenticated user, never a caller-supplied owner ID

Responses:
- 200 OK with updated profile
- 400 Bad Request for invalid fields
- 401 Unauthorized when JWT is missing or invalid
- 403 Forbidden for accounts other than WORKER
- 404 Not Found if no profile has been created

## Job marketplace endpoints

Job listings are public. Creating and managing listings and applications requires authentication. The employer is always derived from the authenticated account; clients cannot choose an employer ID. Public job responses contain employer display names but no email or phone details.

### Search open jobs

- Method: GET
- URL: `/api/jobs`
- Auth required: No
- Query parameters: `search` (job title, description, or employer name), `category` (exact category), `city` (partial city match), `status` (`OPEN` by default, or `CLOSED`), `page` (default `0`), `size` (default `20`), and standard Spring `sort` parameters.

Returns a paginated job response.

### Get a job

- Method: GET
- URL: `/api/jobs/{jobId}`
- Auth required: No

Returns job details and employer display name. Employer contact information is not included.

### Create, edit, or close a job

- Methods and URLs: `POST /api/jobs`, `PUT /api/jobs/{jobId}`, `PATCH /api/jobs/{jobId}/status`
- Auth required: Yes
- Authorization: The creator owns the job; only that account can edit, close, or reopen it. Closed listings cannot be edited.
- Validation: title (120 chars), description (4000), category (60), city/province (100 each); employment type is `FULL_TIME`, `PART_TIME`, `CONTRACT`, or `TEMPORARY`; status is `OPEN` or `CLOSED`.

### Apply to a job

- Method: POST
- URL: `/api/jobs/{jobId}/applications`
- Auth required: Yes
- Request: optional `message` (up to 1000 characters)
- Authorization: The job must be open; employers cannot apply to their own jobs; each account may apply once per job.

The response contains the applicant's name and application message, not email or phone.

### Read applications

- Applicant's own applications: `GET /api/jobs/me/applications` (authenticated, paginated)
- Employer's applications for a listing: `GET /api/jobs/{jobId}/applications` (authenticated job owner only)
- Review an application: `PATCH /api/jobs/{jobId}/applications/{applicationId}` with `{"status":"ACCEPTED"}` or `{"status":"REJECTED"}` (authenticated job owner only; pending applications only)

Applicant/employer contact information is not returned in application responses. Cross-user and cross-employer access is denied.

## Messaging endpoints

Messaging endpoints require a valid authenticated account. Conversation and message responses contain display names and message content only; email addresses and phone numbers are never returned.

### List or start a conversation

- List: `GET /api/conversations`
- Start or retrieve an existing one-to-one conversation: `POST /api/conversations`
- Auth required: Yes
- Request body: `{"participantId":"<user UUID>"}`
- Authorization: The current account is derived from the JWT. A conversation cannot be started with the current user, and repeating a request returns the existing conversation.

### Read or send messages

- Read paginated history: `GET /api/conversations/{conversationId}/messages?page=0&size=50&sort=createdAt,desc`
- Send: `POST /api/conversations/{conversationId}/messages`
- Auth required: Yes
- Send request body: `{"content":"Hello"}`
- Validation: message content must not be blank and may contain at most 4000 characters.
- Authorization: Only one of the conversation participants may read history or send a message. Non-participant access is rejected.

## Notification endpoints

Notification endpoints require a valid authenticated account. The recipient is always determined from the JWT; callers cannot select or override it. Notifications currently cover job applications, application decisions, and incoming messages. Resource responses contain no email address or phone number.

### List notifications

- Method: GET
- URL: `/api/notifications?page=0&size=20`
- Auth required: Yes
- Returns a paginated list ordered newest first, including each notification's type, title, message, resource type/ID, creation time, and read time.

### Get unread notification count

- Method: GET
- URL: `/api/notifications/unread-count`
- Auth required: Yes
- Returns `{"count":0}` or the current user's unread notification count.

### Mark a notification as read

- Method: PATCH
- URL: `/api/notifications/{notificationId}/read`
- Auth required: Yes
- Authorization: The notification recipient only. A notification owned by another user is returned as not found.
- Returns the updated notification response.

## Content reporting and moderation endpoints

Report submission requires authentication. A report may target a business, worker profile, job, or business review. The API validates that the target exists, accepts a reason (`SPAM`, `HARASSMENT`, `INAPPROPRIATE`, `FRAUD`, or `OTHER`) and optional details up to 1000 characters, and rejects duplicate open reports by the same reporter for the same target. Reporter identity is omitted from all report responses.

### Submit a report

- Method: POST
- URL: `/api/reports`
- Auth required: Yes

```json
{
  "targetType": "JOB",
  "targetId": "7f6aba4b-643f-41ec-a509-94b8f4381404",
  "reason": "FRAUD",
  "details": "The listing appears to request an upfront payment."
}
```

Returns `201 Created` with the report ID, target, reason, details, status, and timestamps. Returns `400` for invalid fields, `404` when the target does not exist, and `409` for an existing open report by the same account.

### List open reports

- Method: GET
- URL: `/api/reports?page=0&size=20`
- Auth required: Yes
- Authorization: `ROLE_ADMIN` only

Returns a paginated queue ordered oldest first with a summary of the reported content. Reporter IDs, names, email addresses, and phone numbers are never returned.

### Record a moderation decision

- Method: PATCH
- URL: `/api/reports/{reportId}/moderation`
- Auth required: Yes
- Authorization: `ROLE_ADMIN` only
- Request status: `ACTIONED` or `DISMISSED`; optional moderation note up to 1000 characters. Open reports cannot be reopened through this endpoint.

```json
{
  "status": "ACTIONED",
  "moderationNote": "Reviewed and handled by a moderator."
}
```

An actioned/dismissed decision closes the report and records the moderator and timestamp. The report workflow records the action but does not automatically hide or delete reported content.

## Business image endpoints

Business images are stored in Cloudinary and their metadata is persisted in PostgreSQL.
Image uploads and management are strictly restricted to the authenticated business owner (`accountType = BUSINESS`), while photo galleries can be browsed publicly.

### Image upload specifications & limits:
- Maximum file size: **5 MB**
- Maximum photos per business: **10**
- Allowed image formats: **JPEG (`.jpg`, `.jpeg`)**, **PNG (`.png`)**, **WebP (`.webp`)**
- Rejected formats: SVG (preventing XSS/script execution), GIF, PDF, executables
- Content validation: Image magic bytes and integrity are validated server-side
- Automatic cover designation: The first photo uploaded for a business automatically becomes the cover photo

---

### Upload business image

- Method: POST
- URL: `/api/businesses/{businessId}/images`
- Content-Type: `multipart/form-data`
- Auth required: Yes
- Authorization: Authenticated owner of `{businessId}` with `accountType = BUSINESS`

Form parameters:
- `file` (binary, required): The image file (max 5MB, JPEG/PNG/WebP).
- `isCover` (boolean, optional, default: `false`): When `true`, automatically unsets previous cover and designates this photo as the new cover.

Sample response (201 Created):

```json
{
  "id": "8e3b5e43-85b9-4a9f-9a1b-3fbb13854123",
  "businessId": "7f6aba4b-643f-41ec-a509-94b8f4381404",
  "imageUrl": "https://res.cloudinary.com/kasicircle/image/upload/v1/kasicircle/businesses/7f6aba4b-643f-41ec-a509-94b8f4381404/abc123.jpg",
  "storageId": "kasicircle/businesses/7f6aba4b-643f-41ec-a509-94b8f4381404/abc123",
  "fileName": "storefront.jpg",
  "contentType": "image/jpeg",
  "fileSize": 1548290,
  "isCover": true,
  "sortOrder": 0,
  "createdAt": "2026-11-02T22:00:00Z"
}
```

Responses:
- 201 Created on success
- 400 Bad Request for invalid image format, corrupted payload, file > 5MB, or quota reached (>10 photos)
- 401 Unauthorized when JWT is missing or invalid
- 403 Forbidden if the user is not a BUSINESS account or does not own the business
- 404 Not Found if the business does not exist

---

### List business images (Gallery)

- Method: GET
- URL: `/api/businesses/{businessId}/images`
- Auth required: No (Public)
- Authorization: Accessible to anonymous visitors, residents, workers, and business owners

Images are returned ordered with the cover photo first, followed by sort order and creation date descending.

Sample response (200 OK):

```json
[
  {
    "id": "8e3b5e43-85b9-4a9f-9a1b-3fbb13854123",
    "businessId": "7f6aba4b-643f-41ec-a509-94b8f4381404",
    "imageUrl": "https://res.cloudinary.com/kasicircle/image/upload/v1/kasicircle/businesses/7f6aba4b-643f-41ec-a509-94b8f4381404/abc123.jpg",
    "storageId": "kasicircle/businesses/7f6aba4b-643f-41ec-a509-94b8f4381404/abc123",
    "fileName": "storefront.jpg",
    "contentType": "image/jpeg",
    "fileSize": 1548290,
    "isCover": true,
    "sortOrder": 0,
    "createdAt": "2026-11-02T22:00:00Z"
  },
  {
    "id": "a1b2c3d4-e5f6-4a9b-8c7d-0e1f2a3b4c5d",
    "businessId": "7f6aba4b-643f-41ec-a509-94b8f4381404",
    "imageUrl": "https://res.cloudinary.com/kasicircle/image/upload/v1/kasicircle/businesses/7f6aba4b-643f-41ec-a509-94b8f4381404/interior.jpg",
    "storageId": "kasicircle/businesses/7f6aba4b-643f-41ec-a509-94b8f4381404/interior",
    "fileName": "interior.jpg",
    "contentType": "image/jpeg",
    "fileSize": 2104320,
    "isCover": false,
    "sortOrder": 0,
    "createdAt": "2026-11-02T22:05:00Z"
  }
]
```

Responses:
- 200 OK with list of image metadata
- 404 Not Found if the business does not exist

---

### Delete business image

- Method: DELETE
- URL: `/api/businesses/{businessId}/images/{imageId}`
- Auth required: Yes
- Authorization: Authenticated owner of `{businessId}` with `accountType = BUSINESS`

Deletes the image file from Cloudinary and deletes the record from PostgreSQL.
If the deleted image was the cover photo, another remaining image (if available) is automatically promoted to cover.

Responses:
- 204 No Content on successful deletion
- 401 Unauthorized when JWT is missing or invalid
- 403 Forbidden if the user is not a BUSINESS account or does not own the business
- 404 Not Found if the business or image does not exist

---

### Set cover image

- Method: PUT
- URL: `/api/businesses/{businessId}/images/{imageId}/cover`
- Auth required: Yes
- Authorization: Authenticated owner of `{businessId}` with `accountType = BUSINESS`

Atomically unsets the cover flag on all other images for `{businessId}` and sets `isCover = true` on `{imageId}`.

Sample response (200 OK):

```json
{
  "id": "a1b2c3d4-e5f6-4a9b-8c7d-0e1f2a3b4c5d",
  "businessId": "7f6aba4b-643f-41ec-a509-94b8f4381404",
  "imageUrl": "https://res.cloudinary.com/kasicircle/image/upload/v1/kasicircle/businesses/7f6aba4b-643f-41ec-a509-94b8f4381404/interior.jpg",
  "storageId": "kasicircle/businesses/7f6aba4b-643f-41ec-a509-94b8f4381404/interior",
  "fileName": "interior.jpg",
  "contentType": "image/jpeg",
  "fileSize": 2104320,
  "isCover": true,
  "sortOrder": 0,
  "createdAt": "2026-11-02T22:05:00Z"
}
```

Responses:
- 200 OK with updated image metadata
- 401 Unauthorized when JWT is missing or invalid
- 403 Forbidden if the user is not a BUSINESS account or does not own the business
- 404 Not Found if the business or image does not exist

## Environment variables and local configuration

To run the backend with live Cloudinary image storage, configure the following environment variables:

| Variable | Description | Example / Note |
| :--- | :--- | :--- |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | `kasicircle` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `abcdefghijklmnopqrstuvwxyz01234` |
| `DB_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://localhost:5432/kasicircle` |
| `DB_USERNAME` | PostgreSQL database username | `postgres` |
| `DB_PASSWORD` | PostgreSQL database password | `postgres` |
| `JWT_SECRET` | Secret key for HMAC-SHA256 JWT signing | At least 32 characters |

### Local testing notes:
- Automated tests mock Cloudinary and execute entirely without network access or real credentials.
- In test profiles (`test`), Flyway is disabled to allow H2 in-memory databases to run without failing on PostgreSQL-specific partial indexes.

## Standard error format

All API errors use the same JSON payload structure:

```json
{
  "timestamp": "2026-08-14T18:00:00Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Authentication required.",
  "path": "/api/users/me"
}
```
