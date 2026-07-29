# Sprint 2.2 Postman Testing: Update User Profile

This document provides test cases for the `PUT /api/users/me` endpoint.

**Prerequisites:**
1. A user must be registered and logged in.
2. A valid JWT token must be obtained from the `/api/auth/login` endpoint.
3. In Postman, set the `Authorization` header for each request: `Bearer {{your_jwt_token}}`.

---

### Test Case 1: Successful Update

**Description:** Verifies that a user can successfully update their `firstName`, `lastName`, and `phoneNumber`.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/users/me`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{your_jwt_token}}`
- **Body (raw, JSON):**
  ```json
  {
    "firstName": "JohnUpdated",
    "lastName": "DoeUpdated",
    "phoneNumber": "+11234567890"
  }
  ```

**Expected Response:**
- **Status Code:** `200 OK`
- **Body:**
  ```json
  {
    "id": "user-uuid-goes-here",
    "firstName": "JohnUpdated",
    "lastName": "DoeUpdated",
    "email": "user.email@example.com",
    "phoneNumber": "+11234567890",
    "role": "USER"
  }
  ```
  *(Note: `id` and `email` will be the authenticated user's actual values and should not have changed.)*

---

### Test Case 2: Missing JWT

**Description:** Verifies that the endpoint returns `401 Unauthorized` when the JWT is missing.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/users/me`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: *(Header is omitted)*
- **Body (raw, JSON):**
  ```json
  {
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "12345"
  }
  ```

**Expected Response:**
- **Status Code:** `401 Unauthorized`

---

### Test Case 3: Invalid JWT

**Description:** Verifies that the endpoint returns `401 Unauthorized` for an invalid or expired JWT.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/users/me`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer an-invalid-or-expired-token`
- **Body (raw, JSON):**
  ```json
  {
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "12345"
  }
  ```

**Expected Response:**
- **Status Code:** `401 Unauthorized`

---

### Test Case 4: Invalid Phone Number

**Description:** Verifies that a request with an invalid phone number format is rejected.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/users/me`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{your_jwt_token}}`
- **Body (raw, JSON):**
  ```json
  {
    "firstName": "Jane",
    "lastName": "Doe",
    "phoneNumber": "not-a-number"
  }
  ```

**Expected Response:**
- **Status Code:** `400 Bad Request`
- **Body (may include details like):**
  ```json
  {
    "phoneNumber": "Phone number must be between 10 and 15 digits and may start with a plus sign"
  }
  ```

---

### Test Case 5: Blank First Name

**Description:** Verifies that a request with a blank `firstName` is rejected.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/users/me`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{your_jwt_token}}`
- **Body (raw, JSON):**
  ```json
  {
    "firstName": "",
    "lastName": "Doe",
    "phoneNumber": "+19876543210"
  }
  ```

**Expected Response:**
- **Status Code:** `400 Bad Request`
- **Body (may include details like):**
  ```json
  {
    "firstName": "First name cannot be blank"
  }
  ```

---

### Test Case 6: Attempt to Change Email, Password, or Role

**Description:** Verifies that including `email`, `password`, or `role` in the request body does not change their values. The DTO only includes fields for `firstName`, `lastName`, and `phoneNumber`, so other fields will be ignored during deserialization.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/users/me`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{your_jwt_token}}`
- **Body (raw, JSON):**
  ```json
  {
    "firstName": "SafeUpdate",
    "lastName": "User",
    "phoneNumber": "+12223334444",
    "email": "new.email@example.com",
    "password": "newPassword123",
    "role": "ADMIN"
  }
  ```

**Expected Response:**
- **Status Code:** `200 OK`
- **Body:**
  ```json
  {
    "id": "user-uuid-goes-here",
    "firstName": "SafeUpdate",
    "lastName": "User",
    "email": "user.email@example.com", // Email is UNCHANGED
    "phoneNumber": "+12223334444",
    "role": "USER" // Role is UNCHANGED
  }
  ```
  *(Note: The original `email` and `role` are returned, proving they were not modified.)*
