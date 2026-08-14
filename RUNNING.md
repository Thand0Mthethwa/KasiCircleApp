# Running KasiCircle Backend

This file explains how to run the KasiCircle backend application locally.

## Prerequisites

- Java 21 installed
- Maven installed
- PostgreSQL running locally or reachable from your environment
- A PostgreSQL database created for the backend
- Required environment variables set

## Required Environment Variables

Before starting the backend, set the following variables:

```bash
export DB_USERNAME=your_postgres_user
export DB_PASSWORD=your_postgres_password
export DB_URL=jdbc:postgresql://localhost:5432/kasicircle
export JWT_SECRET=your-long-random-jwt-secret
```

- `DB_URL`: Connection string for your PostgreSQL database
- `DB_USERNAME`: PostgreSQL username used by the backend
- `DB_PASSWORD`: PostgreSQL password used by the backend
- `JWT_SECRET`: A strong secret used to sign JWT tokens. Use at least 32 random characters.

## Running the Application

From the repository root, run:

```bash
cd backend
mvn spring-boot:run
```

If your shell has the environment variables set, the backend will start on the default port `8080`.

## Running Tests

To run the backend test suite:

```bash
cd backend
mvn test
```

## Notes

- The backend is a Spring Boot application.
- If you use a different PostgreSQL host, update `DB_URL` accordingly.
- If a `mvnw` wrapper is not present, use the system-installed `mvn` command.
