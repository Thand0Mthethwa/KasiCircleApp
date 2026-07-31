# Sprint 2.3 Postman Testing: Change Password

This document provides test cases for the `PUT /api/users/change-password` endpoint.

**Prerequisites:**
1. A user must be registered and logged in.
2. A valid JWT token must be obtained from the `/api/auth/login` endpoint.
3. In Postman, set the `Authorization` header for each request: `Bearer {{your_jwt_token}}`.

---

### Test Case 1: Successful Password Change

**Description:** Verifies that a user can successfully change their password.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/users/change-password`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{your_jwt_token}}`
- **Body (raw, JSON):**
  ```json
  {
    "currentPassword": "old-secure-password",
    "newPassword": "new-very-secure-password-123!",
    "confirmPassword": "new-very-secure-password-123!"
  }
  ```

**Expected Response:**
- **Status Code:** `200 OK`

---

### Test Case 2: Incorrect Current Password

**Description:** Verifies that the endpoint returns `400 Bad Request` when the `currentPassword` is incorrect.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/users/change-password`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{your_jwt_token}}`
- **Body (raw, JSON):**
  ```json
  {
    "currentPassword": "wrong-password",
    "newPassword": "new-very-secure-password-123!",
    "confirmPassword": "new-very-secure-password-123!"
  }
  ```

**Expected Response:**
- **Status Code:** `400 Bad Request`
- **Body (may include details like):**
  ```json
  {
    "error": "Incorrect current password."
  }
  ```

---

### Test Case 3: New Passwords Do Not Match

**Description:** Verifies that the endpoint returns `400 Bad Request` when `newPassword` and `confirmPassword` do not match.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/users/change-password`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{your_jwt_token}}`
- **Body (raw, JSON):**
  ```json
  {
    "currentPassword": "old-secure-password",
    "newPassword": "new-very-secure-password-123!",
    "confirmPassword": "a-different-password"
  }
  ```

**Expected Response:**
- **Status Code:** `400 Bad Request`
- **Body (may include details like):**
  ```json
  {
    "error": "New password and confirmation password do not match."
  }
  ```

---

### Test Case 4: Weak New Password

**Description:** Verifies that a request with a weak `newPassword` is rejected.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/users/change-password`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{your_jwt_token}}`
- **Body (raw, JSON):**
  ```json
  {
    "currentPassword": "old-secure-password",
    "newPassword": "weak",
    "confirmPassword": "weak"
  }
  ```

**Expected Response:**
- **Status Code:** `400 Bad Request`
- **Body (may include details like):**
  ```json
  {
    "newPassword": "Password must be at least 8 characters long and contain at least one digit, one lowercase letter, one uppercase letter, and one special character."
  }
  ```
---

### Test Case 5: Missing JWT

**Description:** Verifies that the endpoint returns `401 Unauthorized` when the JWT is missing.

**Request:**
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/users/change-password`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: *(Header is omitted)*
- **Body (raw, JSON):**
  ```json
  {
    "currentPassword": "old-secure-password",
    "newPassword": "new-very-secure-password-123!",
    "confirmPassword": "new-very-secure-password-123!"
  }
  ```

**Expected Response:**
- **Status Code:** `401 Unauthorized`
