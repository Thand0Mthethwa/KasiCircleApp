# Sprint 3.2 Postman Testing: View Businesses

This document provides test cases for the business-related `GET` endpoints.

**Prerequisites:**
1. At least one business should exist in the database. To create one, use the `POST /api/businesses` endpoint.
2. For authenticated endpoints, a user must be registered and logged in with a valid JWT.

---

### Test Case 1: Get Business by ID (Successful)

**Description:** Verifies that a single business can be retrieved by its ID.

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/businesses/{{businessId}}`
- **Headers:**
  - `Content-Type`: `application/json`

**Expected Response:**
- **Status Code:** `200 OK`
- **Body (JSON):** The `BusinessResponse` DTO for the requested business.
  ```json
  {
    "id": "{{businessId}}",
    "name": "The Corner Cafe",
    "description": "A cozy cafe serving the best coffee in town.",
    "phoneNumber": "+27112223333",
    "email": "contact@cornercafe.co.za",
    "category": "Food & Beverage",
    "address": "123 Main Road",
    "city": "Johannesburg",
    "province": "Gauteng",
    "ownerId": "{{ownerId}}",
    "createdAt": "...",
    "updatedAt": "..."
  }
  ```

---

### Test Case 2: Get Business by ID (Not Found)

**Description:** Verifies that a `404 Not Found` is returned for a non-existent business ID.

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/businesses/{{nonExistentBusinessId}}` (e.g., `a1b2c3d4-e5f6-7890-1234-567890abcdef`)
- **Headers:**
  - `Content-Type`: `application/json`

**Expected Response:**
- **Status Code:** `404 Not Found`

---

### Test Case 3: Get All Businesses (Paginated)

**Description:** Verifies that a paginated list of all businesses is returned.

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/businesses?page=0&size=5&sort=name,asc`
- **Headers:**
  - `Content-Type`: `application/json`

**Expected Response:**
- **Status Code:** `200 OK`
- **Body (JSON):** A paginated response containing up to 5 businesses, sorted by name ascending.
  ```json
  {
    "content": [
        {
            "id": "...",
            "name": "A-Business",
            ...
        },
        ...
    ],
    "pageable": { ... },
    "totalElements": ...,
    "totalPages": ...,
    "last": ...,
    "size": 5,
    "number": 0,
    "sort": { ... },
    "numberOfElements": ...,
    "first": true,
    "empty": ...
  }
  ```

---

### Test Case 4: Get Businesses for Authenticated User (Successful)

**Description:** Verifies that an authenticated user can retrieve only the businesses they own.

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/users/me/businesses`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{your_jwt_token}}`

**Expected Response:**
- **Status Code:** `200 OK`
- **Body (JSON):** A paginated response containing only the businesses owned by the authenticated user.

---

### Test Case 5: Get Businesses for Authenticated User (No JWT)

**Description:** Verifies that a `401 Unauthorized` is returned when the JWT is missing.

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/users/me/businesses`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: *(Header is omitted)*

**Expected Response:**
- **Status Code:** `401 Unauthorized`

---

## Sprint 3.3 Business Update and Delete Tests

### Test Case 6: Update Business Profile (Successful)

**Description:** Verifies that a business owner can update their own business profile.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/businesses/{{businessId}}`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{jwt_token}}`
- **Body:**
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

**Expected Response:**
- **Status Code:** `200 OK`
- **Body:** Updated `BusinessResponse` JSON.

### Test Case 7: Update Business Profile (Invalid Data)

**Description:** Verifies that invalid request data returns `400 Bad Request`.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/businesses/{{businessId}}`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{jwt_token}}`
- **Body:**
  ```json
  {}
  ```

**Expected Response:**
- **Status Code:** `400 Bad Request`

### Test Case 8: Update Business Profile (Missing JWT)

**Description:** Verifies that missing authentication returns `401 Unauthorized`.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/businesses/{{businessId}}`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: *(Header omitted)*

**Expected Response:**
- **Status Code:** `401 Unauthorized`

### Test Case 9: Update Business Profile (Invalid JWT)

**Description:** Verifies that an invalid JWT returns `401 Unauthorized`.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/businesses/{{businessId}}`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer invalid_token`

**Expected Response:**
- **Status Code:** `401 Unauthorized`

### Test Case 10: Update Business Profile (Non-owner)

**Description:** Verifies that a user cannot update another user's business.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/businesses/{{otherBusinessId}}`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{jwt_token_for_other_user}}`

**Expected Response:**
- **Status Code:** `403 Forbidden`

### Test Case 11: Update Business Profile (Non-existent Business)

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
