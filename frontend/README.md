# KasiConnect Frontend

React + Vite frontend for the KasiConnect application.

## Setup

### Prerequisites

- Node.js 16+ and npm (or yarn/pnpm)

### Installation

```bash
cd frontend
npm install
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
- ✅ Home dashboard
- ✅ Bottom navigation
- ✅ JWT authentication integration
- ✅ Responsive design (mobile-first)
- ✅ Reusable components
- ✅ Tailwind CSS styling

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

Backend URL: `http://localhost:8081` (configurable via `.env.local`)

## Styling

Using Tailwind CSS with custom design system:
- Color palette: `colors.kasi.green`, `colors.kasi.orange`, etc.
- Component utilities: `.btn-primary`, `.input-field`, `.card-stat`, etc.
- Custom components in `/src/components/index.js`

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge). Mobile-first responsive design optimized for 390px+ screens.

## Notes

- Mock data is used for home statistics and worker lists
- Future screens (Jobs, Explore, Messages, Profile) are placeholders
- API integration is ready for expansion
