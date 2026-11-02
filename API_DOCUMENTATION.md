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

### Get all businesses

- Method: GET
- URL: /api/businesses
- Auth required: No (Public)
- Authorization: None (Accessible to anonymous visitors and authenticated users)

Query parameters:
- page
- size
- sort

Responses:
- 200 OK with paginated list of public business summaries

### Get business by id

- Method: GET
- URL: /api/businesses/{id}
- Auth required: No (Public)
- Authorization: None (Accessible to anonymous visitors and authenticated users)

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
