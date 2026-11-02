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
