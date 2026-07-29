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
