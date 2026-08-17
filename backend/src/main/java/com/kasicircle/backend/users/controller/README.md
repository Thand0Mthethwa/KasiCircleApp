# User API

## GET /api/users/me

Retrieves the profile information for the currently authenticated user.

### Authentication

- Bearer Token: A valid JWT must be included in the Authorization header.

**Example Request:**

```http
GET /api/users/me
Host: localhost:8081
Authorization: Bearer <your-jwt-token>
```

**Example Response (200 OK):**

```json
{
  "id": "a4b1c2d3-e4f5-g6h7-i8j9-k0l1m2n3o4p5",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+1234567890",
  "role": "USER"
}
```

### HTTP Status Codes

- 200 OK: The user's profile was successfully retrieved.
- 401 Unauthorized: The request is missing a valid JWT, or the token is invalid or expired.
- 404 Not Found: The authenticated user could not be found in the database.
