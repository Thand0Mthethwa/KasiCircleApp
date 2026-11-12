# KasiCircle Frontend

React, Vite and JavaScript marketplace frontend for KasiCircle. The cream-and-forest design follows the KasiCircle preview in the owner's portfolio, with editorial serif headings and accessible sans-serif controls.

## Setup

### Prerequisites

- Node.js 22.12+ and npm

### Installation

```bash
cd frontend
cp .env.example .env.local
npm ci
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173` with proxy to backend at `http://localhost:8081`.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/        # React Context providers (Auth)
├── pages/           # Page components
├── services/        # API services
├── App.jsx          # Main app component with routing
├── main.jsx         # Entry point
└── index.css        # Global styles (Tailwind)
```

## Features

- ✅ Onboarding flow
- ✅ Welcome page
- ✅ Login with form validation
- ✅ Registration with account type selector
- ✅ API-backed community homepage
- ✅ Bottom navigation
- ✅ JWT authentication integration
- ✅ Responsive design (mobile-first)
- ✅ Reusable components
- ✅ Tailwind CSS styling
- ✅ Business discovery, reviews, galleries and owner management
- ✅ Worker discovery, skills and worker profile editing
- ✅ Job posting, applications and employer management
- ✅ Private messaging, notifications and administrator moderation

## Authentication

- Login and registration connect to the Spring Boot backend
- JWT tokens are stored in localStorage
- Protected routes redirect unauthenticated users to welcome screen
- Auth state is managed via React Context

## API Integration

All API calls go through `/src/services/api.js`:
- `authService` - login, register
- `userService` - get user, update profile
- `businessService` - get businesses, create business
- `workerService` - public skills directory and private profile management
- `jobService` - listings, posting, applications and employer decisions
- `messagingService`, `notificationService`, `reportService` - protected communication and moderation

The committed `.env.example` sets `VITE_API_BASE_URL=http://localhost:8081`. Edit `.env.local` to use a different API origin. `VITE_*` values are public browser configuration; never add backend secrets or private credentials. Actual environment files remain ignored by Git.

## Styling

Tokens live in `tailwind.config.js` and `src/index.css`: cream canvas `#fbfcf5`, forest `#183d2d`, sage `#d8e8bf`, warm surfaces and accessible olive-gray text. Typography uses local system fonts and Georgia, with no external font download.

`AppShell.jsx` owns desktop/mobile navigation and account actions. Shared controls remain in `components/index.jsx`; `ui.jsx`, `MarketplaceCards.jsx` and `AuthLayout.jsx` provide reusable states, listing cards and authentication layouts. `useDialogFocus.js` handles keyboard focus containment/restoration for existing gallery/delete dialogs.

Listings, names, ratings and photos use backend responses. Decorative shop illustrations are not fictional business records or verification claims. Loading, error, retry and empty states remain distinct.

## Browser Support

Responsive layouts target 375px mobile, 768px tablet, 1280px desktop and 1440px large desktop. Chrome is exercised by browser QA; Firefox/Safari/Edge compatibility has not been independently verified by this redesign.

## Verification

```bash
npm test -- --maxWorkers=1 --no-file-parallelism
npm run lint
npm run build
```

`npm run test:e2e` requires the unchanged backend packaged as `backend/target/backend-0.0.1-SNAPSHOT.jar`, Chrome/Playwright Chromium, `psql`, and `E2E_DATABASE_URL` pointing to an **isolated local database named kasicircle_qa**. Follow the guard in `playwright.config.js`; never use a development/production database. Browser journeys create QA accounts and promote a generated QA administrator. An optional `E2E_CHROME_PATH` selects an installed Chrome executable.

Desktop/mobile projects run the real API journeys in `e2e/marketplace.spec.js`. The responsive project runs `e2e/ui.spec.js`: clearly labeled, intercepted UI fixtures check every route at four widths, labels/headings, keyboard interactions, loading/retry and reduced motion. Fixtures never enter application code or a database. Generated `test-results` and `playwright-report` directories stay ignored.

See the [redesign plan](../docs/FRONTEND_REDESIGN_PLAN.md) and [final QA report](../docs/FRONTEND_REDESIGN_QA.md) for phase progress, evidence and verification limits. These checks do not deploy the app or replace an owner-authorized hosted CI/release process.
