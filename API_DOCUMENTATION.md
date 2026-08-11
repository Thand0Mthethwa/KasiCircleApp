# KasiCircle API Documentation - Sprint 3.2

## User Profile Management

### Update Authenticated User Profile

Updates the profile information for the currently authenticated user.

- **URL:** `/api/users/me`
- **Method:** `PUT`
- **Authentication:** Required (JWT Bearer Token)

#### Request Body

| Field         | Type   | Required | Description                                                                                             |
|---------------|--------|----------|---------------------------------------------------------------------------------------------------------|
| `firstName`   | String | Yes      | The user's first name. Max 15 characters. Cannot be blank.                                              |
| `lastName`    | String | Yes      | The user's last name. Max 15 characters. Cannot be blank.                                               |
| `phoneNumber` | String | No       | The user's phone number. Must be 10-15 digits, optionally starting with a `+`. E.g., `+1234567890`.      |

---

### Change Authenticated User Password

Securely changes the password for the currently authenticated user.

- **URL:** `/api/users/change-password`
- **Method:** `PUT`
- **Authentication:** Required (JWT Bearer Token)

#### Request Body

| Field               | Type   | Required | Description                                                                                                   |
|---------------------|--------|----------|---------------------------------------------------------------------------------------------------------------|
| `currentPassword`   | String | Yes      | The user's current password. Cannot be blank.                                                                 |
| `newPassword`       | String | Yes      | The user's new password. Minimum 8 characters. Must be a strong password. Cannot be blank.                     |
| `confirmPassword`   | String | Yes      | The confirmation of the new password. Must match `newPassword`. Cannot be blank.                                |

---
## Business Profile Management

### Create a new Business Profile

Creates a new business profile for the currently authenticated user.

- **URL:** `/api/businesses`
- **Method:** `POST`
- **Authentication:** Required (JWT Bearer Token)

#### Request Body

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


### Get a Business by ID

Retrieves a single business by its unique identifier.

- **URL:** `/api/businesses/{id}`
- **Method:** `GET`
- **Authentication:** Not Required

#### URL Parameters

| Parameter | Type | Description                       |
|-----------|------|-----------------------------------|
| `id`      | UUID | The unique identifier of the business. |

#### Responses

- **200 OK:** Returned upon success. The response body will contain the `BusinessResponse` DTO.
- **404 Not Found:** Returned if a business with the specified ID does not exist.

---

### Update a Business Profile

Updates a business profile that is owned by the currently authenticated user.

- **URL:** `/api/businesses/{id}`
- **Method:** `PUT`
- **Authentication:** Required (JWT Bearer Token)
- **Authorization:** Only the business owner may update the business.

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | The unique identifier of the business to update. |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | The name of the business. |
| `description` | String | Yes | A description of the business. |
| `phoneNumber` | String | Yes | The business's contact phone number. |
| `email` | String | Yes | The business's contact email. Must be a valid email address. |
| `category` | String | Yes | The category of the business. |
| `address` | String | Yes | The physical address of the business. |
| `city` | String | Yes | The city where the business is located. |
| `province` | String | Yes | The province where the business is located. |

#### Responses

- **200 OK:** The business was updated successfully. Returns the updated `BusinessResponse`.
- **400 Bad Request:** Validation failed for the request body.
- **401 Unauthorized:** JWT is missing, invalid, or expired.
- **403 Forbidden:** The authenticated user does not own the business.
- **404 Not Found:** No business exists with the specified ID.

#### Example Request

```http
PUT /api/businesses/{{businessId}}
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

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

#### Example Response

```json
{
  "id": "{{businessId}}",
  "name": "Updated Business",
  "description": "Updated description",
  "phoneNumber": "+27123456789",
  "email": "updated@example.com",
  "category": "Retail",
  "address": "456 Updated Street",
  "city": "Cape Town",
  "province": "Western Cape",
  "ownerId": "{{ownerId}}",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### Delete a Business Profile

Deletes a business profile owned by the currently authenticated user.

- **URL:** `/api/businesses/{id}`
- **Method:** `DELETE`
- **Authentication:** Required (JWT Bearer Token)
- **Authorization:** Only the business owner may delete the business.

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | The unique identifier of the business to delete. |

#### Responses

- **204 No Content:** The business was deleted successfully.
- **401 Unauthorized:** JWT is missing, invalid, or expired.
- **403 Forbidden:** The authenticated user does not own the business.
- **404 Not Found:** No business exists with the specified ID.

#### Example Request

```http
DELETE /api/businesses/{{businessId}}
Authorization: Bearer {{jwt_token}}
```

#### Example Response

```http
HTTP/1.1 204 No Content
```

---

### Get All Businesses (Paginated)

Retrieves a paginated list of all businesses.

- **URL:** `/api/businesses`
- **Method:** `GET`
- **Authentication:** Not Required

#### Query Parameters

| Parameter | Type    | Description                                                                 | Default      |
|-----------|---------|-----------------------------------------------------------------------------|--------------|
| `page`    | integer | The page number to retrieve (0-indexed).                                    | `0`          |
| `size`    | integer | The number of businesses per page.                                          | `20`         |
| `sort`    | string  | A comma-separated list of properties to sort by (e.g., `name,asc`, `createdAt,desc`). | `createdAt,desc` |

#### Responses

- **200 OK:** Returned upon success. The response body will contain a paginated list of `BusinessResponse` DTOs.

---

### Get Businesses for Authenticated User

Retrieves a paginated list of businesses owned by the currently authenticated user.

- **URL:** `/api/users/me/businesses`
- **Method:** `GET`
- **Authentication:** Required (JWT Bearer Token)

#### Query Parameters

| Parameter | Type    | Description                                                                 | Default      |
|-----------|---------|-----------------------------------------------------------------------------|--------------|
| `page`    | integer | The page number to retrieve (0-indexed).                                    | `0`          |
| `size`    | integer | The number of businesses per page.                                          | `20`         |
| `sort`    | string  | A comma-separated list of properties to sort by (e.g., `name,asc`, `createdAt,desc`). | `createdAt,desc` |

#### Responses

- **200 OK:** Returned upon success. The response body will contain a paginated list of `BusinessResponse` DTOs owned by the user. An empty list is returned if the user owns no businesses.
- **401 Unauthorized:** Returned if the JWT is missing, invalid, or expired.
