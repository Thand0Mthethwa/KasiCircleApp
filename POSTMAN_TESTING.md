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
