# E-KALUSUGAN — Claude Code Context

## Project Overview

Web-based appointment scheduling, queue management, and analytics system for
Bago City Primary Care Facility (dental services only). Capstone project for
BSIT at STI West Negros University.

Scope: dental services at Bago City Primary Care Facility only. Does not
replace actual medical consultations or integrate with external platforms.

## Directory Structure

Capstone/
├── capstone-app/ # React + Vite frontend
│ └── src/
│ ├── components/
│ │ └── common/ # Shared UI components
│ ├── pages/ # Role-based dashboards and views
│ └── api.js # Axios instance with interceptor
└── server/
└── src/
├── controllers/
├── routes/
├── models/
├── middleware/
└── seedAdmin.js # Excluded from Git via .gitignore

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, React Router v6, Axios
- **Backend**: Node.js, Express.js, MySQL, jsonwebtoken, bcryptjs, Nodemon
- **Dev/Testing**: Thunder Client, Postman, cURL
- **Vite proxy**: `/api` → `localhost:5000`

## User Roles

patient, doctor, staff, admin — each has a dedicated portal/dashboard.

## Database Schema (MySQL)

Tables: `users`, `patient_profiles`, `services`, `queues`, `queue_services`,
`appointments`, `consultations`, `doctor_availability`

Key column notes:

- `patients` table uses `full_name` as a single column, NOT `first_name`/`last_name`
- `queue_services.services` is stored as `JSON.stringify`; must be parsed on
  every retrieval using a `_parse` helper applied across all Queue model methods
- No `admins` table exists. Admin accounts are stored in the `staff` table
  with `position = 'Administrator'`. The GET staff query uses UNION to include them.

## Auth & Security

- JWT-based auth with role-based access control
- `role` field must NEVER be caller-controlled in registration endpoints
- Staff and nurse accounts must be admin-created, never self-registered
- Initial admin account created via `seedAdmin.js` (direct DB insert, excluded from Git)
- JWT secrets generated via `crypto.randomBytes`; never reuse between dev and production

## Critical Coding Rules

### Axios Interceptor

`api.js` auto-unwraps `res.data`. All downstream service consumers must operate
on the unwrapped result directly. Never access `.data` again on the result.

```js
// WRONG
const result = await someService.get();
console.log(result.data);

// CORRECT
const result = await someService.get();
console.log(result);
```

### Text Colors in React

All text colors must use inline `style={{ color: "#..." }}`, NOT Tailwind color
utility classes. `index.css` CSS custom properties override Tailwind in dark mode.

```jsx
// WRONG
<p className="text-blue-700">...</p>

// CORRECT
<p style={{ color: "#1a3a8f" }}>...</p>
```

### React Hooks Scope

Hooks (e.g., `useNavigate`, `useState`) must always be called inside component
function bodies, never at module scope.

### Targeted Fixes

Only change the specific part of the code that needs fixing. Do not rewrite
entire files unless explicitly asked.

## Design System

| Token          | Value                  |
| -------------- | ---------------------- |
| Primary blue   | `#1a3a8f`              |
| Secondary blue | `#1e4db7`              |
| Indigo accent  | `#4f46e5`              |
| Orange accent  | `#f97316`              |
| Dark navy      | `#2d3a8c` / `#1e1b4b`  |
| Border radius  | `20px` / `rounded-2xl` |

## API Route Conventions

Watch for singular/plural mismatch: `DoctorDashboard.jsx` may call `/api/doctor`
while the route is mounted as `/api/doctors` (or vice versa). Verify before
adding new routes.

## Dev Bypass System

`devBypass.js` middleware + `DevLoginPanel.jsx` are in place for local
role-based testing without going through normal login flow.

## Known Outstanding Work

- `adminRoutes.js` handlers return hardcoded stub data — replace with real MySQL queries
- Confirm `StaffDashboard` component exists and is complete (previously missing;
  staff were routed to admin dashboard as a workaround)
- Descriptive and predictive analytics module — not yet started
- Doctor availability tracking UI — not yet started
- PWA/offline functionality — listed in scope, not yet implemented
- Audit all API route names for singular/plural consistency

## Resolved Issues (Do Not Reopen)

- `queueService.js` copy-pasted auth exports bug — fully resolved
- Security loophole (caller-controlled `role` in registration) — closed via
  admin-only account creation for privileged roles
