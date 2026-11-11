# KasiCircle

KasiCircle connects South African township communities with local businesses, workers and job opportunities, with customer reviews, private messaging, activity notifications and administrator report review.

## Technology

- Frontend: React 18, Vite, Tailwind CSS, React Router
- Backend: Java 21, Spring Boot 3.5, Spring Security, JWT
- Database: PostgreSQL with Flyway migrations
- Business image storage: Cloudinary

## Prerequisites

- Java 21 and Maven
- Node.js 22.12+ and npm
- PostgreSQL
- Cloudinary credentials for business image uploads (optional when image uploads are not needed)

## Local development

Create a PostgreSQL database named `kasicircle`, then configure the backend environment:

```bash
export DB_URL=jdbc:postgresql://localhost:5432/kasicircle
export DB_USERNAME=your_postgres_user
export DB_PASSWORD=your_postgres_password
export JWT_SECRET=use_a_random_secret_at_least_32_characters_long
export JWT_EXPIRATION=86400000
export APP_CORS_ALLOWED_ORIGIN=http://localhost:5173
export CLOUDINARY_CLOUD_NAME=your_cloud_name
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_api_secret
```

`DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET` are required. Use a randomly generated JWT secret of at least 32 bytes; `JWT_EXPIRATION` defaults to 24 hours. Keep credentials in environment variables or an untracked local environment file; never commit secrets. Cloudinary settings can be omitted when image uploads are not needed.

Start the backend in one terminal:

```bash
cd backend
mvn spring-boot:run
```

Flyway applies database migrations at startup. The API listens on `http://localhost:8081`.

In another terminal, configure and run the frontend:

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

The frontend is served at `http://localhost:5173`. Set `VITE_API_BASE_URL` in `frontend/.env.local` when the backend uses a different address.

## Verification

Run backend tests:

```bash
cd backend
mvn test
```

Run frontend tests, lint, and production build:

```bash
cd frontend
npm test -- --maxWorkers=1 --no-file-parallelism
npm run lint
npm run build
```

Frontend component tests mock API boundaries; backend tests use H2/mocks. These suites do not require live PostgreSQL or Cloudinary credentials. Integrated Playwright journeys require an isolated local PostgreSQL database; see [QA instructions](./docs/QA.md).

GitHub Actions runs backend verification and PostgreSQL migration/startup checks, plus desktop/mobile integrated browser journeys, sequential frontend tests, lint, and production build, on pushes and pull requests.

## Production packaging

Build the backend JAR and frontend assets:

```bash
cd backend
mvn clean package

cd ../frontend
npm ci
npm run build
```

The backend artifact is written to `backend/target/`; static frontend assets are written to `frontend/dist/`. Configure `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and a unique randomly generated `JWT_SECRET` (at least 32 bytes) through the hosting platform's secret manager. Do not reuse the CI/test key or rely on application defaults. Set `VITE_API_BASE_URL` to the public HTTPS API origin before building the frontend and set the backend's `APP_CORS_ALLOWED_ORIGIN` to the exact deployed frontend origin. The current backend configuration accepts one frontend origin. Serve the frontend with SPA route fallback enabled and terminate TLS at the hosting platform or reverse proxy. Do not use the Vite development server as a production web server.

No deployment or cloud resources are created by these build commands.

## Documentation

- [API documentation](./API_DOCUMENTATION.md)
- [Database migrations](./docs/DATABASE_MIGRATIONS.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Deployment and operations](./docs/DEPLOYMENT.md)
- [Reproducible QA](./docs/QA.md)
- [Known limitations](./docs/KNOWN_LIMITATIONS.md)
- [Feature verification](./docs/MVP_FEATURE_VERIFICATION.md)
- [Release readiness](./docs/RELEASE_READINESS.md)

## License

MIT
