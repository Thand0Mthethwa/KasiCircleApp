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
