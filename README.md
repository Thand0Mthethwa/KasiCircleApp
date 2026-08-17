# KasiCircle

Connecting township communities to opportunities, trusted local services, and businesses.

## Vision

KasiCircle connects South African communities to local work, trusted services, and businesses through a simple digital platform.

## Tech stack

### Frontend

- React Native
- React

### Backend

- Java 21
- Spring Boot 3.5.4
- Spring Security
- JWT authentication
- PostgreSQL

## Local backend configuration

Set the environment variables before starting the app. The backend listens on port 8081 and expects a local PostgreSQL database.

```bash
export DB_URL=jdbc:postgresql://localhost:5432/kasicircle
export DB_USERNAME=your_postgres_user
export DB_PASSWORD=your_postgres_password
export JWT_SECRET=replace_with_a_secure_random_secret_at_least_32_chars
export JWT_EXPIRATION=86400000
```

Then start the backend:

```bash
cd backend
mvn spring-boot:run
```

The API is available at:

```text
http://localhost:8081
```

## Security notes

- Public routes: POST /api/auth/register and POST /api/auth/login
- Protected routes require a valid Bearer JWT
- Missing or malformed JWTs return a JSON error payload with status, error, message, and path

## Team

Founder

- Thando Mthethwa

## License

MIT
