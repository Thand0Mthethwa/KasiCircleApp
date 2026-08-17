# Postman testing guide

Base URL:

```text
http://localhost:8081
```

## 1. Register a user

POST /api/auth/register

Headers:
- Content-Type: application/json

Body:

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "phoneNumber": "+27821112222",
  "password": "Password123!"
}
```

Expected: 201 Created

## 2. Log in

POST /api/auth/login

Headers:
- Content-Type: application/json

Body:

```json
{
  "email": "jane.doe@example.com",
  "password": "Password123!"
}
```

Expected: 200 OK with a JWT token in the response body.

## 3. Read current user profile

GET /api/users/me

Headers:
- Authorization: Bearer <jwt_token>

Expected: 200 OK

## 4. Create a business

POST /api/businesses

Headers:
- Authorization: Bearer <jwt_token>
- Content-Type: application/json

Body:

```json
{
  "name": "Corner Cafe",
  "description": "Local coffee shop",
  "phoneNumber": "+27123456789",
  "email": "contact@cornercafe.co.za",
  "category": "Food & Beverage",
  "address": "123 Main Road",
  "city": "Johannesburg",
  "province": "Gauteng"
}
```

Expected: 201 Created

## 5. Get businesses

GET /api/businesses?page=0&size=10

Expected: 200 OK with paginated business data.

## 6. Update own business

PUT /api/businesses/{id}

Headers:
- Authorization: Bearer <jwt_token>
- Content-Type: application/json

Body:

```json
{
  "name": "Updated Business",
  "description": "Updated description",
  "phoneNumber": "+27123456789",
  "email": "updated@example.com",
  "category": "Retail",
  "address": "456 Updated Street",
  "city": "Cape Town",
  "province": "Western Cape"
}
```

Expected: 200 OK

## 7. Delete own business

DELETE /api/businesses/{id}

Headers:
- Authorization: Bearer <jwt_token>

Expected: 204 No Content

## 8. Missing JWT checks

Request any protected endpoint without the Authorization header:
- GET /api/users/me
- PUT /api/users/me
- PUT /api/users/change-password
- GET /api/users/me/businesses

Expected: 401 Unauthorized

**Description:** Verifies that updating a missing business returns `404 Not Found`.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/businesses/{{nonExistentBusinessId}}`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{jwt_token}}`

**Expected Response:**
- **Status Code:** `404 Not Found`

### Test Case 12: Delete Business Profile (Successful)

**Description:** Verifies that a business owner can delete their own business profile.

**Request:**
- **Method:** `DELETE`
- **URL:** `http://localhost:8080/api/businesses/{{businessId}}`
- **Headers:**
  - `Authorization`: `Bearer {{jwt_token}}`

**Expected Response:**
- **Status Code:** `204 No Content`

### Test Case 13: Delete Business Profile (Missing JWT)

**Description:** Verifies that missing authentication returns `401 Unauthorized`.

**Request:**
- **Method:** `DELETE`
- **URL:** `http://localhost:8080/api/businesses/{{businessId}}`
- **Headers:**
  - `Authorization`: *(Header omitted)*

**Expected Response:**
- **Status Code:** `401 Unauthorized`

### Test Case 14: Delete Business Profile (Invalid JWT)

**Description:** Verifies that an invalid JWT returns `401 Unauthorized`.

**Request:**
- **Method:** `DELETE`
- **URL:** `http://localhost:8080/api/businesses/{{businessId}}`
- **Headers:**
  - `Authorization`: `Bearer invalid_token`

**Expected Response:**
- **Status Code:** `401 Unauthorized`

### Test Case 15: Delete Business Profile (Non-owner)

**Description:** Verifies that a user cannot delete another user's business.

**Request:**
- **Method:** `DELETE`
- **URL:** `http://localhost:8080/api/businesses/{{otherBusinessId}}`
- **Headers:**
  - `Authorization`: `Bearer {{jwt_token_for_other_user}}`

**Expected Response:**
- **Status Code:** `403 Forbidden`

### Test Case 16: Delete Business Profile (Non-existent Business)

**Description:** Verifies that deleting a missing business returns `404 Not Found`.

**Request:**
- **Method:** `DELETE`
- **URL:** `http://localhost:8080/api/businesses/{{nonExistentBusinessId}}`
- **Headers:**
  - `Authorization`: `Bearer {{jwt_token}}`

**Expected Response:**
- **Status Code:** `404 Not Found`

### Test Case 17: Validate Business Deletion by GET

**Description:** Verifies that after a successful delete, the business cannot be retrieved.

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/businesses/{{businessId}}`
- **Headers:**
  - `Content-Type`: `application/json`

**Expected Response:**
- **Status Code:** `404 Not Found`
