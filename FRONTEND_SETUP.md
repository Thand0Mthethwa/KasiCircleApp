# KasiCircle Full Stack Setup

## Quick Start

### Backend (Spring Boot + PostgreSQL)

```bash
# Set environment variables
export DB_URL=jdbc:postgresql://localhost:5432/kasicircle
export DB_USERNAME=your_postgres_user
export DB_PASSWORD=your_postgres_password
export JWT_SECRET=your-long-random-jwt-secret
export JWT_EXPIRATION=86400000

# Start backend
cd backend
mvn spring-boot:run
```

Backend runs on: **http://localhost:8081**

### Frontend (React + Vite)

```bash
# Install dependencies
cd frontend
npm install

# Start dev server
npm run dev
```

Frontend runs on: **http://localhost:5173** (with API proxy to backend)

## Project Structure

```
KasiCircleApp/
├── backend/               # Spring Boot 3.5.4 + PostgreSQL
│   ├── pom.xml
│   └── src/
│       ├── main/java/
│       │   └── com/kasicircle/backend/
│       │       ├── auth/           # Login, Register, JWT
│       │       ├── users/          # User profiles
│       │       ├── businesses/     # Business management
│       │       ├── config/         # Security, database config
│       │       └── shared/         # Exception handling, validation
│       └── test/
│
└── frontend/              # React 18 + Vite + Tailwind CSS
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx          # Main app with routing
        ├── main.jsx         # Entry point
        ├── index.css        # Tailwind + custom styles
        ├── components/      # Reusable UI components
        ├── contexts/        # Auth context & state management
        ├── pages/           # Page components
        │   ├── Onboarding.jsx
        │   ├── Welcome.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Home.jsx
        │   ├── Jobs.jsx     # Placeholder
        │   ├── Explore.jsx  # Placeholder
        │   ├── Messages.jsx # Placeholder
        │   ├── Profile.jsx  # Placeholder
        │   └── NotFound.jsx
        └── services/        # API integration
            └── api.js       # authService, userService, businessService
```

## Frontend Implementation Summary

### Pages Implemented

1. **Onboarding** (`/onboarding`)
   - Hero image placeholder (workers/tools)
   - "Find Trusted Workers" heading
   - Supporting text with township context
   - Progress indicator (2/3)
   - Green Continue button

2. **Welcome** (`/welcome`)
   - Green hero section with KasiConnect branding
   - Category service icons (6 categories)
   - White content area
   - Login, Register, and Guest options
   - Navigates to appropriate next screen

3. **Login** (`/login`)
   - Back navigation
   - Email or phone input
   - Password input (with show/hide toggle)
   - Forgot Password link (placeholder)
   - Form validation
   - Login button with loading state
   - Social login buttons (Phone, Google)
   - Register link

4. **Register** (`/register`)
   - Back navigation
   - Account type selector (Resident/Worker/Business)
   - Form fields: Full Name, Phone, Email, Password
   - Password requirements hint
   - Terms of Service agreement checkbox
   - Form validation
   - Register button with loading state
   - Login link

5. **Home** (`/home`)
   - Green header with location and user greeting
   - Notification button
   - Search bar for workers/jobs/businesses
   - Statistics cards (1,240+ Workers, 87 Jobs, 340+ Businesses)
   - Categories section (horizontally scrollable)
   - Nearby Workers section with verification badges
   - Bottom navigation (Home, Jobs, Explore, Messages, Profile)

### Reusable Components

- `Button` - Primary, secondary, tertiary, and icon variants
- `Input` - Text input with labels, errors, hints
- `Header` - Page header with back button
- `Card` - Generic card container
- `StatCard` - Statistics display with icon and value
- `CategoryCard` - Category selector with icon
- `WorkerCard` - Worker profile card with verification badge
- `BottomNavigation` - Tab-based navigation
- `SearchBar` - Search input with icon buttons
- `LoadingSpinner` - Animated loading indicator
- `ProgressIndicator` - Step indicator for onboarding

### Design System

**Colors:**
- Primary Green: `#2D9D78` (kasi-green)
- Light Green: `#E8F5F1` (kasi-green-light)
- Dark Green: `#1F6B54` (kasi-green-dark)
- Orange: `#FF9800` (kasi-orange)
- Light Orange: `#FFE0B2` (kasi-orange-light)
- Neutrals: 900-50 scale

**Typography:**
- Font stack: System fonts with fallback to sans-serif
- Sizes: xs, sm, base, lg, xl, 2xl, 3xl, 4xl
- Weights: Regular, semibold, bold

**Spacing:**
- Gutter: 16px (standard), 20px (large)
- Border radius: 16px, 20px
- Responsive: Mobile-first design (390px base)

### Authentication Flow

1. User starts at Onboarding or Welcome (if not authenticated)
2. Chooses Login or Register
3. Submits credentials to Spring Boot backend
4. Backend returns JWT token
5. Token stored in localStorage
6. AuthContext manages authentication state
7. Protected routes redirect to Welcome if not authenticated
8. User lands on Home dashboard

### API Integration

**Services:**
- `authService.register()` - POST /api/auth/register
- `authService.login()` - POST /api/auth/login
- `userService.getCurrentUser()` - GET /api/users/me
- `userService.updateProfile()` - PUT /api/users/me
- `userService.changePassword()` - PUT /api/users/change-password
- `businessService.getAllBusinesses()` - GET /api/businesses
- `businessService.getBusinessById()` - GET /api/businesses/{id}
- `businessService.createBusiness()` - POST /api/businesses
- `businessService.updateBusiness()` - PUT /api/businesses/{id}
- `businessService.deleteBusiness()` - DELETE /api/businesses/{id}

**Backend URL:** Configured via `VITE_API_BASE_URL` in `.env.local` (default: `http://localhost:8081`)

### Form Validation

- **Registration:** Full name, phone, email format, password length (min 8)
- **Login:** Email/phone required, password required
- **Real-time:** Errors clear when user starts typing
- **API Errors:** Displayed prominently if backend returns error

### Responsive Design

- **Base viewport:** 390px (mobile)
- **Mobile screens:** 360px, 375px, 414px
- **Tablet:** 768px+
- **Desktop:** 1024px+
- Mobile-first Tailwind CSS configuration
- Touch-friendly button sizing (48px+ minimum)

### Accessibility

- Semantic HTML elements
- ARIA labels for buttons and icons
- Keyboard navigation support
- Visible focus states
- Color contrast: WCAG AA compliance
- Form labels and error messages linked to inputs

### Build & Deployment

**Development:**
```bash
cd frontend
npm run dev      # Starts Vite dev server on port 5173
```

**Production:**
```bash
npm run build    # Creates optimized dist/ folder
npm run preview  # Preview production build locally
```

**Build Output:**
- Bundle size: ~195KB (uncompressed), ~61KB (gzipped)
- 1376 modules transformed
- CSS: 18.14KB (3.96KB gzipped)
- JS: 194.83KB (60.78KB gzipped)

## Next Steps

### Immediate
1. Test complete flow: Onboarding → Welcome → Login/Register → Home
2. Verify backend connectivity with real API calls
3. Test form validation and error handling
4. Verify responsive design on multiple screen sizes

### Future Implementation
- Jobs page with job listings and filtering
- Explore page for discovering workers/businesses
- Messages page with real-time chat
- Profile page with user management
- Category filtering on home page
- Worker detail pages with reviews/ratings
- Business detail pages
- Job application flow
- Payment integration
- Notifications system
- Search functionality
- Real-time updates with WebSocket

## Git Commits

```
1. feat(frontend): add KasiConnect design system and initial React project setup
2. feat(frontend): implement authentication screens (onboarding, welcome, login, register)
3. feat(frontend): implement home dashboard with navigation and statistics
```

## Troubleshooting

### Port already in use
If port 5173 is busy:
```bash
npm run dev -- --port 5174
```

### Backend API not connecting
- Verify backend is running on http://localhost:8081
- Check `.env.local` has correct `VITE_API_BASE_URL`
- Check browser console for CORS errors

### Build errors
- Delete `node_modules` and `dist` folder
- Run `npm install` again
- Run `npm run build`

## Technology Stack

### Frontend
- **React 18** - UI library
- **Vite 5** - Build tool & dev server
- **Tailwind CSS 3** - Utility-first styling
- **React Router 6** - Client-side routing
- **Lucide React** - Icon library

### Backend
- **Java 21** - Runtime
- **Spring Boot 3.5.4** - Framework
- **Spring Security** - Authentication & authorization
- **JWT (jjwt)** - Token-based auth
- **PostgreSQL** - Database
- **Lombok** - Boilerplate reduction
- **JUnit 5 & Mockito** - Testing

### DevTools
- **npm** - Package manager
- **PostCSS & Autoprefixer** - CSS processing
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

**Last Updated:** August 17, 2026  
**Sprint:** KasiConnect React UI Implementation  
**Status:** ✅ Complete - All screens implemented, build verified, ready for testing
