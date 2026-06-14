# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**E-KALUSUGAN** is a full-stack appointment scheduling and patient management system for healthcare facilities. It's built as a two-part application:

- **Frontend**: React 19 + Vite + React Router + Tailwind CSS v4 + Recharts
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
  reset-test-data.js   # Utility: clears today's demo queue/consultation/prescription data
  src/
    server.js          # Express app entry point with middleware setup
    config/            # Database connection pool (mysql2/promise)
    models/            # Data access layer (User, Patient, Doctor, Appointment, Queue, etc.)
    controllers/       # Request handlers (logic layer)
    routes/            # API endpoint definitions (auth, patient, doctor, admin, queue, appointment)
    middleware/        # authenticate (JWT), authorize, devBypass (dev-only auth bypass)
    utils/             # generateQueueNumber, phone normalization, responseHelper
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
node reset-test-data.js  # Reset today's demo data (queues, consultations, prescriptions)
```

The backend requires MySQL running locally with credentials specified in `server/.env`.

### Full Stack Startup

1. Start MySQL server locally
2. In `server/`: `npm run dev`
3. In `capstone-app/`: `npm run dev`

Access the app at `http://localhost:3000` (frontend proxies API calls to the backend).

## No Tests, No Migrations

There is **no test suite** (no Jest, Vitest, or Mocha configured) and **no database migration tool**. The database schema must be set up manually. Run `npm run test:db` in `server/` only to verify the MySQL connection is alive.

## Authentication & Security

### JWT-Based Auth Flow

1. User logs in via LoginPage → calls `authService.login()` → POST `/api/auth/login`
2. Backend returns JWT token + user object
3. Frontend stores both in localStorage (keys: `ek_token`, `ek_user`) via AuthContext
4. API requests include token in `Authorization: Bearer <token>` header
5. Backend middleware (`authenticate.js`) verifies JWT using `process.env.JWT_SECRET`

**Phone number is the primary login identifier** (Philippine format: 09xxxxxxxxx). The `normalizePhilippineMobilePhone()` utility in `server/src/utils/phone.js` enforces this. Username lookup is secondary fallback.

### Development Auth Bypass

Two methods work when `NODE_ENV=development`:

**Header-based** (for curl/Postman — injects a mock user, no real token):
```
x-dev-role: patient | doctor | staff | admin
```

**Route-based** (returns a real JWT token useful for frontend testing):
```bash
POST /api/auth/dev-login
Body: { "role": "patient" }
```

### Role-Based Routing

- Frontend: `ProtectedRoute` component checks `user.role` and redirects to role-specific dashboard
- Backend: `authorize(...roles)` middleware guards routes; accepts comma-separated roles
- Role → dashboard mapping: `patient → /patient`, `doctor → /doctor`, `staff → /staff`, `admin → /admin`
- `normalizeProfile()` in `authController.js` shapes the returned user object differently per role (doctor gets specialization, patient gets barangay, etc.)

## Key Architecture Patterns

### Frontend

- **AuthContext + useAuth**: Global session state managed via React Context (not Redux)
- **Service layer**: `api.js` is an axios instance with request interceptor (auto-attaches JWT) and response interceptor (unwraps `.data`, normalizes errors to message string). Services wrap this instance.
- **Tailwind CSS v4**: Uses the Vite plugin (`@tailwindcss/vite`) — syntax differs from v3. Custom font: Poppins. Brand colors are applied via inline `style` props (blue gradients: `#1a3a8f` to `#1e4db7`), not Tailwind config.

### Backend

- **Models as static objects**: No ORM. Each model (`User.js`, `Patient.js`, etc.) exports a plain object with async methods that call the mysql2/promise pool directly. All queries use parameterized placeholders.
- **Connection pooling**: `config/db.js` exports a mysql2/promise pool (10 max connections, Philippine timezone +08:00). Rows are always destructured: `const [rows] = await pool.query(...)`.
- **Controller pattern**: Routes delegate to controllers; controllers call model methods and handle HTTP response.
- **Middleware order** (important): `devBypass` is mounted **before** `authenticate` in `server.js` so the bypass takes effect first.
- **Helmet + CORS**: Security headers enabled; CORS origins configurable via `process.env.ALLOWED_ORIGINS`.
- **Rate limiting**: 100 requests per 15 minutes on `/api/auth/*` endpoints.
- **Health check**: GET `/api/health` available for monitoring.

### Queue System

Auto-generated queue numbers follow formats: `Q-001` (general), `G-001`, `P-001`. Same-day queue registration auto-creates an appointment with `reason='Same-day queue registration'` — the `reset-test-data.js` script filters by this reason when cleaning up demo data.

## Configuration

### Environment Variables

**Frontend** (`capstone-app/.env.development`):
```
VITE_API_URL=http://localhost:5000
VITE_DEV_BYPASS=false
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

Tables include: `users`, `patients`, `doctors`, `staff`, `appointments`, `queues`, `consultations`, `prescriptions`, `specializations`.

- **Authentication**: passwords are bcrypt-hashed; stored in `password_hash` column
- **User lookup**: by `phone` (primary) or `username` (fallback)
- **Timestamps**: `created_at`, `updated_at` in UTC (converted to PST +08:00 at connection level)
- **No transactions**: current models do not use database transactions

## Adding a New API Endpoint

1. Create route handler in `server/src/routes/newRoutes.js`
2. Write controller logic in `server/src/controllers/newController.js`
3. Add model queries to `server/src/models/Model.js`
4. Mount route in `server.js`: `app.use("/api/new", newRoutes)`
5. Create service function in `capstone-app/src/services/newService.js`
6. Use service in component via hooks or direct calls
