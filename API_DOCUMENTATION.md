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
  "password": "Password123!"
}
```

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

### Create business

- Method: POST
- URL: /api/businesses
- Auth required: Yes

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

### Get all businesses

- Method: GET
- URL: /api/businesses
- Auth required: No

Query parameters:
- page
- size
- sort

### Get business by id

- Method: GET
- URL: /api/businesses/{id}
- Auth required: No

### Update business

- Method: PUT
- URL: /api/businesses/{id}
- Auth required: Yes
- Authorization: business owner only

### Delete business

- Method: DELETE
- URL: /api/businesses/{id}
- Auth required: Yes
- Authorization: business owner only

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
