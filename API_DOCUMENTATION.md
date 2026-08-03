# KasiCircle API Documentation - Sprint 2.2

## User Profile Management

### Update Authenticated User Profile

Updates the profile information for the currently authenticated user.

- **URL:** `/api/users/me`
- **Method:** `PUT`
- **Authentication:** Required (JWT Bearer Token)

#### Request Body

The request body must be a JSON object containing the fields to update.

| Field         | Type   | Required | Description                                                                                             |
|---------------|--------|----------|---------------------------------------------------------------------------------------------------------|
| `firstName`   | String | Yes      | The user's first name. Max 15 characters. Cannot be blank.                                              |
| `lastName`    | String | Yes      | The user's last name. Max 15 characters. Cannot be blank.                                               |
| `phoneNumber` | String | No       | The user's phone number. Must be 10-15 digits, optionally starting with a `+`. E.g., `+1234567890`.      |

**Example Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+19876543210"
}
```

#### Responses

- **200 OK:** Returned upon a successful update. The response body will contain the updated `UserProfileResponse` DTO.

  **Example Response Body:**
  ```json
  {
    "id": "c4a4e1a3-1c3e-4b9d-8c4a-8d6e3e5a0b1f",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "original.user.email@example.com",
    "phoneNumber": "+19876543210",
    "role": "USER"
  }
  ```

- **400 Bad Request:** Returned if the request body fails validation (e.g., blank names, invalid phone number format). The response body will contain details about the validation errors.

  **Example Response Body:**
  ```json
  {
      "firstName": "First name cannot be blank"
  }
  ```

- **401 Unauthorized:** Returned if the JWT is missing, invalid, or expired.

---

### Change Authenticated User Password

Securely changes the password for the currently authenticated user.

- **URL:** `/api/users/change-password`
- **Method:** `PUT`
- **Authentication:** Required (JWT Bearer Token)

#### Request Body

The request body must be a JSON object containing the current and new passwords.

| Field               | Type   | Required | Description                                                                                                   |
|---------------------|--------|----------|---------------------------------------------------------------------------------------------------------------|
| `currentPassword`   | String | Yes      | The user's current password. Cannot be blank.                                                                 |
| `newPassword`       | String | Yes      | The user's new password. Minimum 8 characters. Must be a strong password. Cannot be blank.                     |
| `confirmPassword`   | String | Yes      | The confirmation of the new password. Must match `newPassword`. Cannot be blank.                                |

**Example Request:**
```json
{
  "currentPassword": "old-secure-password",
  "newPassword": "new-very-secure-password-123!",
  "confirmPassword": "new-very-secure-password-123!"
}
```

#### Responses

- **200 OK:** Returned upon a successful password change. The response body will be empty.

- **400 Bad Request:** Returned under the following conditions:
  - The request body fails validation (e.g., blank fields, weak `newPassword`).
  - The `newPassword` and `confirmPassword` fields do not match.
  - The `newPassword` is the same as the `currentPassword`.
  - The `currentPassword` is incorrect.

  **Example Error Response Body:**
  ```json
  {
      "error": "New password and confirmation password do not match."
  }
  ```

- **401 Unauthorized:** Returned if the JWT is missing, invalid, or expired.

---

## Business Profile Management

### Create a new Business Profile

Creates a new business profile for the currently authenticated user.

- **URL:** `/api/businesses`
- **Method:** `POST`
- **Authentication:** Required (JWT Bearer Token)

#### Request Body

The request body must be a JSON object containing the business details.

| Field         | Type   | Required | Description                                       |
|---------------|--------|----------|---------------------------------------------------|
| `name`        | String | Yes      | The name of the business.                         |
| `description` | String | Yes      | A description of the business.                    |
| `phoneNumber` | String | Yes      | The business's contact phone number.              |
| `email`       | String | Yes      | The business's contact email. Must be a valid email format. |
| `category`    | String | Yes      | The category of the business (e.g., Retail, Food).|
| `address`     | String | Yes      | The physical address of the business.             |
| `city`        | String | Yes      | The city where the business is located.           |
| `province`    | String | Yes      | The province where the business is located.       |

**Example Request:**
```json
{
  "name": "The Corner Cafe",
  "description": "A cozy cafe serving the best coffee in town.",
  "phoneNumber": "+27112223333",
  "email": "contact@cornercafe.co.za",
  "category": "Food & Beverage",
  "address": "123 Main Road",
  "city": "Johannesburg",
  "province": "Gauteng"
}
```

#### Responses

- **201 Created:** Returned upon successful creation. The response body will contain the created `BusinessResponse` DTO.

  **Example Response Body:**
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "The Corner Cafe",
    "description": "A cozy cafe serving the best coffee in town.",
    "phoneNumber": "+27112223333",
    "email": "contact@cornercafe.co.za",
    "category": "Food & Beverage",
    "address": "123 Main Road",
    "city": "Johannesburg",
    "province": "Gauteng",
    "ownerId": "c4a4e1a3-1c3e-4b9d-8c4a-8d6e3e5a0b1f",
    "createdAt": "2026-07-31T15:00:00.000000Z",
    "updatedAt": "2026-07-31T15:00:00.000000Z"
  }
  ```

- **400 Bad Request:** Returned if the request body fails validation (e.g., blank fields, invalid email). The response body will contain details about the validation errors.

  **Example Response Body:**
  ```json
  {
      "name": "Business name is required."
  }
  ```

- **401 Unauthorized:** Returned if the JWT is missing, invalid, or expired.
---
