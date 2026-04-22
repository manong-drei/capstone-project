# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**E-KALUSUGAN** is a full-stack appointment scheduling and patient management system for healthcare facilities. It's built as a two-part application:

- **Frontend**: React 19 + Vite + React Router + Tailwind CSS + Recharts
- **Backend**: Express.js + MySQL 2 + JWT authentication + bcrypt password hashing
- **Database**: MySQL with role-based access control (patient, doctor, staff, admin)

The project supports role-based dashboards and workflows for four user types: patients (book appointments), doctors (view schedules), staff (manage queue), and admins (system oversight).

## Directory Structure

```
capstone-app/          # React frontend (port 3000)
  src/
    pages/             # Role-specific dashboards + auth pages
    components/        # UI components (common, dashboards, landing)
    services/          # API client layer (authService, appointmentService, queueService)
    hooks/             # Custom hooks (useAuth, useQueue)
    context/           # React Context (AuthContext for session state)
    constants/         # Routes, roles, API endpoints
    index.css          # Tailwind-based styling

server/                # Express backend (port 5000)
  src/
    server.js          # Express app entry point with middleware setup
    config/            # Database connection pool (mysql2/promise)
    models/            # Data access layer (User, Patient, Doctor, Appointment, Queue, etc.)
    controllers/       # Request handlers (logic layer)
    routes/            # API endpoint definitions (auth, patient, doctor, admin, queue, appointment)
    middleware/        # authenticate (JWT), authorize, devBypass (dev-only auth bypass)
    utils/             # Utility functions
```

## Development Commands

### Frontend (capstone-app/)

```bash
npm run dev      # Start Vite dev server with HMR (http://localhost:3000)
npm run build    # Build optimized production bundle
npm run preview  # Preview production build locally
npm run lint     # Run ESLint to check code style
```

The frontend proxies API calls to `http://localhost:5000` via Vite's proxy config (`vite.config.js`).

### Backend (server/)

```bash
npm run dev      # Start Express with nodemon auto-reload (http://localhost:5000)
npm start        # Start Express directly (production)
npm run test:db  # Test MySQL database connection
```

The backend requires MySQL running locally with credentials specified in `server/.env`.

### Full Stack Startup

1. Start MySQL server locally
2. In `server/`: `npm run dev`
3. In `capstone-app/`: `npm run dev`

Access the app at `http://localhost:3000` (frontend proxies API calls to the backend).

## Authentication & Security

### JWT-Based Auth Flow

1. User logs in via LoginPage → calls `authService.login()` → POST `/api/auth/login`
2. Backend returns JWT token + user object
3. Frontend stores both in localStorage (keys: `ek_token`, `ek_user`) via AuthContext
4. API requests include token in `Authorization: Bearer <token>` header
5. Backend middleware (`authenticate.js`) verifies JWT using `process.env.JWT_SECRET`

### Development Auth Bypass

In development mode, the `devBypass` middleware (mounted in `server.js` before authenticate) allows skipping JWT by adding an HTTP header:

```
x-dev-role: patient | doctor | staff | admin
```

This is only active when `NODE_ENV=development`. In production, this middleware does nothing. Mock user objects are injected directly (id, fullName, email, role).

### Role-Based Routing

- Frontend: `ProtectedRoute` component checks `user.role` and redirects to appropriate dashboard
- Backend: Routes are not role-protected at the middleware level (most endpoints rely on client-side filtering or accept any authenticated user)
- Four roles: `patient`, `doctor`, `staff`, `admin`

## Key Architecture Patterns

### Frontend

- **AuthContext + useAuth**: Global session state managed via React Context (not Redux)
- **Router-based role redirect**: `/dashboard` endpoint uses `RoleRedirect` component to route users to their role-specific dashboard based on `user.role`
- **Service layer**: `api.js` (axios instance with baseURL), `authService.js`, `appointmentService.js`, `queueService.js` separate API calls from components
- **Tailwind CSS**: All styling uses utility classes; custom theme colors use inline style props (blue gradients: `#1a3a8f` to `#1e4db7`)

### Backend

- **Connection pooling**: `config/db.js` uses mysql2/promise pool with 10 max connections, Philippine timezone (+08:00)
- **Models as static objects**: No ORM; `User.js`, `Patient.js`, `Doctor.js`, etc. are modules with async query methods
- **Controller pattern**: Routes delegate to controllers (in `controllers/`); controllers call model methods
- **Helmet + CORS**: Security headers enabled; CORS origins configurable via `process.env.ALLOWED_ORIGINS`
- **Rate limiting**: 10 requests per 15 minutes on `/api/auth/*` endpoints
- **Health check**: GET `/api/health` available for monitoring

## Configuration

### Environment Variables

**Frontend** (`capstone-app/.env.development`):
```
VITE_API_URL=http://localhost:5000
VITE_DEV_BYPASS=true
```

**Backend** (`server/.env`):
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=''
DB_NAME=ekalusugan_db
JWT_SECRET=ekalusugan_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d
```

In production, change `JWT_SECRET`, set `NODE_ENV=production`, and use proper database credentials.

## Database

Tables include: `users` (base), `patients`, `doctors`, `staff`, `appointments`, `queue`, etc.

- **Authentication**: passwords are bcrypt-hashed; stored in `password_hash` column
- **User lookup**: by `phone` (primary) or `username`
- **Timestamps**: `created_at`, `updated_at` in UTC (converted to PST +08:00 at connection level)

## Common Development Tasks

### Adding a New API Endpoint

1. Create route handler in `server/src/routes/newRoutes.js`
2. Write controller logic in `server/src/controllers/newController.js`
3. Add model queries to `server/src/models/Model.js`
4. Mount route in `server.js`: `app.use("/api/new", newRoutes)`
5. Create service function in `capstone-app/src/services/newService.js`
6. Use service in component via hooks or direct calls

### Testing Auth Flow

Use the dev bypass header in development:
```bash
curl -H "x-dev-role: patient" http://localhost:5000/api/patients
```

Or log in normally via the UI and copy the token from localStorage to use in Postman/curl.

### Database Issues

Run `npm run test:db` in `server/` to verify MySQL connection. Check `.env` credentials and MySQL server status.

## Recent Changes

- StaffDashboard added with dedicated role-based route (`/staff`)
- Dev bypass middleware supports all four roles
- Role redirect in App.jsx routes staff to `/staff` instead of admin dashboard

