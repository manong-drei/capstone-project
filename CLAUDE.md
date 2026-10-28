# CLAUDE.md

This file guides Claude Code and other coding assistants working on **E-KALUSUGAN**. It describes the current repository, not a proposed feature set. Last reviewed against the code: **2026-10-13**.

## Working Rules

- Read the affected code, callers, routes, configuration, and tests before editing. Prefer the smallest complete change and reuse existing components, services, and helpers.
- Keep the current architecture: plain JavaScript, React context and hooks, Express controllers, and SQL models. Do not add an ORM, state library, dependency, or abstraction without a concrete need.
- Preserve validation, role restrictions, accessibility, error handling, transaction boundaries, and patient history. Add or update focused checks for behavior changes; documentation-only changes need no application tests.
- Use source code and package scripts as the authority when older comments or documents disagree. Update this guide when commands, routes, environment variables, schema requirements, or workflows change.
- Never copy real credentials, patient data, JWTs, SMS bodies, or temporary passwords into documentation, fixtures, logs, or commits. Environment examples below contain placeholders.
- Database migrations, demo resets, and real SMS sends change external state. Run them only within the requested task and against the intended database or confirmed recipient.

## Project Overview

E-KALUSUGAN is an appointment, queue, and patient management application for Bago City healthcare workflows. The current patient-facing service is dental care; the backend also supports staff-created general walk-in queues.

| Part | Stack and conventions |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4, Axios, Recharts, Lucide React, GSAP; ES modules |
| Backend | Express 4, mysql2/promise, JWT, bcryptjs, Helmet, CORS, express-rate-limit; CommonJS |
| Database | MySQL; SQL queries and explicit transactions, no ORM |
| Verification | Node's built-in test runner, Playwright Chromium browser tests, frontend ESLint/build |
| Forecasting | Optional Python script using pandas, NumPy, and statsmodels; API reads generated CSV files |

Roles are `patient`, `doctor`, `staff`, and `admin`:

- **Patient:** view profile, book dental appointments, request a dental ticket, monitor it, and cancel eligible tickets with a reason.
- **Doctor:** set daily availability/capacity, manage the dental queue, save consultations/prescriptions, and view/export analytics and reports.
- **Staff:** register walk-ins, search patient records, verify in-person account recovery, confirm presence/returns, manage the dental queue, and open the queue monitor.
- **Admin:** manage patient and staff/doctor/admin accounts, activation SMS, queue oversight, patient history, statistics, and notification settings.

Public self-registration is disabled. `RegisterPage.jsx` and commented registration code are legacy files, not active routes.

## Repository Map

```text
capstone-app/                     React frontend
  src/
    App.jsx                       Lazy-loaded routes and role/password guards
    components/common/            Shared controls, profile menu, queue recovery/reasons
    components/dashboards/        patient/, doctor/, staff/, admin/
    components/pages/             Active cinematic landing page and GSAP hero
    pages/                        Authentication, dashboards, patient profile, monitor
    services/                     Shared Axios client and API wrappers
    hooks/                        useAuth, useQueue, useDashboardIdentity
    context/AuthContext.jsx       Session restoration and localStorage state
    constants/                    Routes, roles, queue states/reasons, dental services
    utils/queueDisplay.js         Queue names and Manila time formatting
    index.css                     Tailwind import and Poppins font
  tests/                          Playwright browser tests and auth helper
  test/doctorReport.test.js        Node tests for report/export helpers
  playwright.config.js            Chromium tests; starts frontend automatically
  vite.config.js                  @/ alias, port 3000, /api proxy
  .github/workflows/playwright.yml Browser-test workflow

server/                           Express backend
  src/
    server.js                     Middleware, route mounts, startup, background workers
    config/                       MySQL pool, connection check, migration runners
    routes/                       auth, devAuth, patient, doctor, admin, queue, appointment
    controllers/                  HTTP validation and workflow handling; SMS/analytics
    models/                       User, Patient, Doctor, Staff, Appointment, Queue
    middleware/                   authenticate, authorize, devBypass
    services/                     smsNotifications outbox worker, queueExpiry worker
    utils/                        authSession, phone, queueOrder, sms, responseHelper
    analytics/                    arima.py and BOHC history/forecast/backtest CSVs
  migrations/005_sms_notifications.sql
  test/                           Node backend tests; optional MySQL grace check
  .env.sms.example                SMS variable template, no real secrets
  SMS_SETUP.md                    Detailed SMS deployment and recovery guide
  QUEUE_GRACE_PERIOD.md           Missed-call lifecycle and API guide
  SERVER_REVIEW.md                Prior audit; re-check findings against current code
  reset-test-data.js              Destructive demo-data cleanup utility

tests/experimental-landing.cjs     Separate manual landing-page check using Edge
documentations/                   Local reference notes; ignored by Git
package.json                      Root placeholder; not a workspace/task runner
```

## Install and Run

Use Node.js `^20.19.0` or `>=22.12.0`, as required by the installed Vite package. Run frontend and backend commands from their own directories. Both have lockfiles; use `npm ci` to install their dependencies. The root `npm test` is a placeholder that intentionally fails.

1. Prepare an existing MySQL database with the required application schema; see the migration limitations below.
2. Configure `server/.env` and the optional frontend development flag.
3. In `server/`, run `npm ci`, then `npm run test:db` to check connectivity and `npm run dev` to start the API.
4. In a separate terminal in `capstone-app/`, run `npm ci`, then `npm run dev`.
5. Open `http://localhost:3000`. The API defaults to port 5000; health is `GET /api/health`.

The server verifies its database connection and starts queue expiry and, when enabled, the SMS worker before listening. Missing worker schema can prevent startup even when MySQL connectivity works. The health endpoint reports API availability, not SMS delivery or a fresh database probe.

### Frontend Commands — `capstone-app/`

```bash
npm ci
npm run dev
npm run build
npm run preview
npm run lint
npm run test:e2e
node --test test/doctorReport.test.js
```

- `dev`: Vite on port 3000; `@/` resolves to `src/`.
- `build`: production files in `dist/`; `preview` serves that build for local inspection.
- `test:e2e`: tests in `tests/`, using Chromium at `http://127.0.0.1:3000`; the config starts/reuses Vite. Protected-workflow tests stub API responses and use synthetic tokens.
- If Chromium is missing, install it with `npx playwright install chromium` before browser tests.
- Report-helper tests are separate from Playwright and have no npm script.

### Backend Commands — `server/`

```bash
npm ci
npm run dev
npm start
npm test
npm run test:db
```

- `dev` uses nodemon; `start` runs `src/server.js` directly. `npm start` does not automatically set `NODE_ENV=production`.
- `test` uses `node --test` and covers queue registration/order/lifecycle, walk-in records, SMS/auth/admin jobs, cleanup, and doctor analytics/reports.
- `test:db` checks the configured database; it is not a substitute for the test suite or schema setup.
- `queueGraceDb.test.js` skips by default. To run the optional database check in PowerShell from `server/`:

```powershell
$env:QUEUE_DB_TESTS = 'true'
node --test test/queueGraceDb.test.js
Remove-Item Env:QUEUE_DB_TESTS
```

That check needs the current `queues` and `queue_sequences` schema and uses isolated temporary tables. Default backend tests mock database/provider interactions; browser mocks do not validate live SQL or paid SMS delivery.

## Environment and Hosting

### Frontend

The Axios client in `src/services/api.js` uses **`baseURL: '/api'`**. Vite proxies `/api` to `http://localhost:5000` during development. `VITE_API_URL` is not read by the current client.

Optional `capstone-app/.env.development`:

```dotenv
VITE_DEV_BYPASS=false
```

`VITE_DEV_BYPASS=true` shows the development login panel; it does not enable backend bypass by itself. Restart Vite after environment changes. For deployment, configure a same-origin `/api` reverse proxy and SPA route fallback. The development proxy is not a production hosting configuration.

### Backend — `server/.env`

```dotenv
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=ekalusugan_db
JWT_SECRET=replace_with_a_random_secret
JWT_EXPIRES_IN=1h
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SMS_ENABLED=false
SMS_API_KEY=
SMS_SENDER_NAME=EKALUSUGAN
SMS_ENCRYPTION_KEY=replace_with_64_random_hex_characters
```

- Use actual local credentials and generated secrets outside source control. A normal session defaults to `1h` if `JWT_EXPIRES_IN` is unset; setup sessions always last 15 minutes.
- CORS accepts a comma-separated `ALLOWED_ORIGINS` list. Its code default is `http://localhost:5173`, although Vite is configured for 3000; set origins explicitly for direct API access.
- The pool allows 10 connections and uses mysql2 date conversion `+08:00`. This does **not** set MySQL's session time zone. Configure database/session time for Asia/Manila because queries use `CURDATE()`, `CURTIME()`, and `NOW()`.
- Production requires `NODE_ENV=production`, real allowed origins, HTTPS, and appropriate database credentials. Development mock access must be disabled.
- SMS variables are also listed in `server/.env.sms.example`. `SMS_ENCRYPTION_KEY` is 32 random bytes encoded as 64 hex characters and must stay stable while encrypted jobs are pending. Patient creation needs it even with `SMS_ENABLED=false`.

Generate an SMS encryption key locally when configuring the environment:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

## Database and Migrations

There is no ORM migration framework or complete base-schema installer in this checkout. The application expects an existing schema. Relevant tables include:

- Accounts/profiles: `users`, `patients`, `doctors`, `staff`, `specializations`, `patient_audit`.
- Scheduling/queue: `appointments`, `queues`, `queue_sequences`, `daily_doctor_settings`.
- Clinical/reporting: `consultations`, `prescriptions`, `vital_signs`, `medical_records`, `doctor_daily_reports`.
- SMS: `sms_settings`, `sms_jobs`, `sms_password_audit`.

Names live in `patients`, `doctors`, and `staff` (including admin profiles), while `users` stores account credentials. `middle_name` and `suffix` are optional, trimmed strings of up to 100 and 20 characters. Blank values clear them; omitted update fields preserve existing values. Full names display as first, middle, last, suffix.

All the following scripts are defined in `server/package.json`; availability of a command does not mean its required SQL file is present.

| Command from `server/` | Purpose and current prerequisite |
| --- | --- |
| `npm run migrate:queue-sequences` | Daily sequence table; references missing `migrations/001_queue_sequences.sql` |
| `npm run migrate:queue-status-reason` | Cancellation/status reason; references missing `migrations/002_queue_status_reason.sql` |
| `npm run migrate:walkin-patients` | Persistent walk-in records, legacy backfill, queue foreign-key changes; references missing `migrations/003_walkin_patients.sql` |
| `npm run migrate:doctor-daily-reports` | Saved daily report table; references missing `migrations/004_doctor_daily_reports.sql` |
| `npm run migrate:sms` | Runs the present `migrations/005_sms_notifications.sql`; requires the earlier schema |
| `npm run migrate:user-names` | Adds optional `middle_name VARCHAR(100)` and `suffix VARCHAR(20)` to `patients`, `staff` (including admins), and `doctors`, and widens `queues.walk_in_name` to fit complete names; safe to rerun |
| `npm run migrate:queue-no-show` | Inline SQL expands the queue status enum; requires `queues` |
| `npm run migrate:queue-grace` | Inline SQL adds grace/call timestamps, count, expiry index, and historical call backfill; designed to be rerunnable |

Back up the target database and stop the API before schema changes. Obtain the missing historical schema from the project owner/approved database backup when needed; do not invent deleted migrations or blindly rerun every script. MySQL DDL is not transactional. The SMS runner refuses a second or partially started application; inspect schema after a failure before retrying. Apply the grace migration before running the updated queue workflow.

The SMS migration preserves permanent password hashes, expires legacy temporary credentials, and adds credential-version checks that require older sessions to log in again. Existing serving tickets remain serving during the grace migration.

## Authentication and Routing

1. Login accepts `{ phone, password }` at `POST /api/auth/login`. Normalize Philippine mobile inputs with `utils/phone.js`: `09xxxxxxxxx`, `+639xxxxxxxxx`, and `639xxxxxxxxx` become the stored `09xxxxxxxxx` form. Username login is disabled.
2. `User.authenticate()` locks the account row, checks active status/credential expiry, verifies the bcryptjs hash, and issues a session. Five failed attempts lock the account for 15 minutes.
3. The frontend stores `ek_token` and `ek_user` in localStorage. `AuthContext` synchronously restores valid, unexpired claims on refresh, tolerates an incomplete user cache, and derives role/setup state from the token. Decoding is for UI restoration; signature/access verification remains on the backend.
4. Axios attaches `Authorization: Bearer <token>`. `authenticate.js` verifies JWTs and rechecks the active account, current role, and `credential_version` on normal requests.
5. Temporary-password login consumes that credential once and issues a `purpose: 'password_setup'` JWT. Until setup completes, only `GET /api/auth/me` and `PATCH /api/auth/change-password` are allowed; the frontend redirects to `/change-password`.
6. Setup accepts `{ newPassword }`; a normal password change also requires `oldPassword`. The new password needs at least 8 characters, a digit, and at most 72 UTF-8 bytes, and must differ from the old password. Success increments the credential version and returns a replacement `token` and `user`; persist both.
7. `GET /api/auth/profile` returns the normalized role profile used by `useDashboardIdentity` and the shared profile menu. `AuthContext.logout()` clears local state; there is no mounted backend logout route.

| Frontend path | Access/behavior |
| --- | --- |
| `/` | Public cinematic landing page |
| `/experimental` | Redirects to `/` |
| `/login` | Public phone/password login |
| `/dashboard` | Protected redirect to the user's dashboard |
| `/change-password` | Protected password setup/change page |
| `/patient`, `/doctor`, `/staff`, `/admin` | Corresponding role only |
| `/staff/patients/:id` | Staff/admin patient record and visit history |
| `/general-queue-monitor` | Staff/admin kiosk; currently displays the dental queue despite its name |

`/register` is not mounted. Unknown routes redirect to `/`. Backend `authorize(...roles)` accepts separate role arguments, for example `authorize('doctor', 'staff')`.

### Development Access

Both backend bypass mechanisms require `NODE_ENV=development`:

- Header: `x-dev-role: patient | doctor | staff | admin`. `devBypass` runs before protected routers and injects a mock identity.
- Route: `POST /api/auth/dev-login` with `{ "role": "patient" }` returns a signed JWT with `purpose: 'development'`; outside development it returns 404.

Mock identities are not provisioned database records. The header mocks use `id`, while production controllers generally need `user_id`; bypass login does not guarantee every database-backed workflow works. Use real test accounts or the existing API-mocked browser fixtures for those flows.

## Queue and Patient Workflows

### Registration, Numbers, and Ordering

- Patient self-registration creates **dental** tickets only, with one or two distinct valid service IDs. Keep frontend `constants/medicalServices.js` aligned with the backend allowlist in `queueController.js`.
- Priority requests require recorded eligibility; categories are `senior`, `pwd`, and `pregnant`, with expiry checked for patient self-queueing.
- A patient can have one active dental ticket and at most two dental registrations per day. Active states are `waiting`, `called`, `serving`, and `missed`; terminal `no_show` does not itself block a new eligible ticket.
- Registration uses the dentist with the lowest `doctor_id`, daily availability, and appointment capacity. The appointment default/max is 10; dental walk-in capacity defaults to 0 (no configured cap) and has a maximum setting of 999.
- Once any dental ticket for the date has been called, new appointment registration for that date closes. An existing eligible booking can still request its ticket. Closure persists between calls; staff walk-in intake remains the alternative.
- Without an active same-day appointment, self-queueing creates a confirmed appointment with the exact reason `Same-day queue registration` in the registration transaction.
- Current numbers come from `Queue.nextQueueNumber()` and locked daily `queue_sequences`, not the unused `utils/generateQueueNumber.js`.

| Ticket source | Regular example | Priority example |
| --- | --- | --- |
| Dental appointment/patient | `AQ01` | `AP01` |
| Dental walk-in | `Q01` | `P01` |
| General walk-in | `G-001` | `G-001` (same general sequence) |

Dental tickets have four independent daily counters: `appointment_regular` (`AQ`), `appointment_priority` (`AP`), `walk_in_regular` (`Q`), and `walk_in_priority` (`P`). Four walk-ins do not advance either appointment counter: the first regular appointment is `AQ01`, and the first priority appointment is `AP01`. New counters start after the highest number already issued today with the same prefix, including cancelled/completed tickets; existing tickets keep their numbers. The existing `queue_sequences.sequence_type` VARCHAR(20) supports these keys without a migration. General tickets retain one shared `general` counter. `queueOrder.projectQueue()` alternates sources, prioritizes eligible tickets within each source, and orders staff-confirmed returns first by return time. Clinic displays, call-next, and SMS positions must use that shared projected order.

### Call, Presence, Missed Turn, and Return

- Call-next changes `waiting → called`; only one called/serving ticket may occupy a category. Staff/doctor confirms physical presence for `called → serving`.
- Recall is available 30 seconds after the first call. Skipping requires two calls and another 30 seconds after the second.
- The first skip changes the ticket to `missed`, starts a 10-minute grace period, and calls the next ticket in the same transaction.
- Staff/doctor records an arrival before the deadline through the return action. The same ticket becomes `waiting` and gets the next opening in return-time order; it does not interrupt a called/serving patient.
- An expired grace window or a second missed turn after returning ends as `no_show`. Terminal tickets cannot be revived. The queue expiry worker runs at startup and every five seconds independently of SMS; ticket actions also check expiry under the category lock.
- The generic status endpoint accepts presence, completion (`serving → done`), and cancellation. Recall/skip/return use their dedicated endpoints. Admins cannot confirm presence.
- Cancellation requires a reason. Patients may cancel their own `waiting` or `missed` ticket; staff/doctor/admin can cancel an eligible active ticket. Registered-patient cancellation/completion also updates the associated appointment status.
- Staff can finish a check-up and call the next patient while a doctor completes the previous notes. Consultation saving accepts eligible serving/done tickets and protects duplicate clinical writes under the shared ticket transaction.

Keep Manila deadline formatting in `utils/queueDisplay.js` and recovery instructions in the common queue components. See `server/QUEUE_GRACE_PERIOD.md` for detailed behavior.

`GET /api/queue/me` includes `wait_estimate` for waiting tickets: minutes, patients ahead, and completed-visit sample count. It uses the shared projected queue order and today's mean call-to-completion time (15 minutes per patient until valid samples exist), subtracting elapsed time for the current patient with a one-minute minimum remaining. Patient Home refreshes every 15 seconds, labels the fallback, and replaces the number with instructions for called, serving, missed, unavailable-doctor, and failed-update states. These are rough estimates; no service-duration schema change is required.

### Walk-In Records

Staff/admin `POST /api/queue/walkin` can create dental or general tickets. General tickets use `GENERAL_CONSULTATION`; current staff dashboard and kiosk controls focus on dental.

Walk-ins are persistent `patients` records with nullable `user_id`, not anonymous queue-only names. Registration validates demographics/mobile/address, searches possible matches, supports selecting `patient_id`, and requires `create_new_confirmed: true` to override a possible duplicate. Priority tickets require a category. Patient updates, new records, and queue activity create `patient_audit` entries.

Staff/admin can search `/api/patients/search` and view `/api/patients/:id`. Phone lookup matches consecutive digits anywhere in a saved patient/account contact after at least four digits, accepts complete local/international formats, ranks exact full-number matches first, and returns at most 20 unarchived records with masked contacts and search audit entries. The walk-in form applies the four-digit threshold to both its patient lookup and contact field; registration still requires a complete valid mobile number. Set `PATIENT_DB_TESTS=true` when running `node --test test/patientSearch.test.js` to verify matching in isolated temporary MySQL tables. `POST /api/patients/:id/merge` requires a different `target_patient_id` and `confirm: true`; only an unarchived walk-in source without a user account may merge into an unarchived target, and conflicting active tickets must be resolved first. The implementation reassigns queue history, archives the source, and writes audit entries; do not assume it also rewrites every clinical/SMS association.

### Queue Monitor

`GeneralQueueMonitor.jsx` polls the dental queue every 10 seconds and preserves backend ordering. Announcements require user activation and browser Web Speech support. They announce calls/recalls, stay quiet on repeated polls/presence changes, and use recognized female English voices, preferring `en-PH`. Missing voices or speech errors show recovery instructions while the visual monitor remains usable. Keep keyboard access, responsive layout, and reduced-motion support intact.

## SMS Notifications and Account Activation

Implementation: `services/smsNotifications.js`, `utils/sms.js`, `controllers/smsController.js`, and the admin Notifications/patient management components. Read `server/SMS_SETUP.md` before changing delivery or activation behavior.

- Admin-created patient accounts receive a cryptographically random six-digit temporary password through an encrypted MySQL outbox. Account creation and the queued password job commit together; responses contain `sms_job_id`/`sms_status`, never a plaintext password.
- SMS temporary credentials expire 72 hours after first submission, including rejected submission; retries do not extend expiry. Expired/lost setup sessions can use the existing admin SMS replacement or in-person staff/admin recovery.
- `sms_settings.threshold` defaults to 5 and accepts integers 1–100. Initial positions within the threshold are permanently `suppressed` and must stay nearby; positions farther back are `armed` and enqueue an alert when they reach the threshold. Staff must relay the walk-in registration notice.
- Eligibility rechecks current-day waiting status, account/patient association, active/unarchived records, and the registered or confirmed matching walk-in contact. Queue alerts include no patient name, diagnosis, or service details.
- With `SMS_ENABLED=true`, the worker validates provider configuration, initializes existing waiting tickets, runs every five seconds, and wakes after relevant changes. MySQL advisory/category/account locks and durable job claims coordinate delivery; network requests occur outside clinic-action locks.
- Pending bodies use AES-256-GCM. Clear bodies on submission, failure, cancellation, or uncertainty; expose only masked recipients/statuses to the UI. Keep keys and message bodies out of logs.
- Semaphore requests use the approved alphanumeric sender, one recipient, and at most 160 ASCII characters. Certain connection/429 failures retry with bounded attempts; ambiguous submissions become `unknown` and are never automatically resent. Check provider history before replacing a credential. Provider `sent` does not mean the patient read the SMS.

Admin interfaces: `GET/PUT /api/admin/sms-settings`, `GET /api/admin/sms-jobs` (latest 100 jobs), and `POST /api/admin/patients/:user_id/temporary-password` with `{ identity_confirmed: true }`. Queue alerts have no manual resend action.

### Staff-Assisted Account Recovery

Read `server/ACCOUNT_RECOVERY.md` for the workflow and request contract. Login offers in-person reception instructions; staff open **Account recovery** from their dashboard, and admins open it from patient management. The patient profile exposes safe nullable `account` metadata: registered login phone, active status, and credential version. Birthdays are displayed in Philippine time.

`POST /api/patients/:id/account-recovery` requires a real staff/admin session, the profile's `expected_credential_version`, and strict confirmations for patient presence, first name, last name, login phone, barangay/city address, and birthday. Development bypass identities cannot issue recovery credentials. Requests are limited to 10 per authenticated staff account per 15 minutes on each API instance.

The transaction locks the patient and account, validates eligibility and version, stores a bcrypt hash with a 30-minute expiry, increments the credential version, resets lockout/redemption state, cancels queued/submitting password SMS jobs, and writes a sanitized `patient_audit` entry. Only the successful issuance response exposes the generated password, with `Cache-Control: no-store`. The UI holds it in memory and clears it on close, expiry, or navigation. Login consumes it once and requires the existing 15-minute password setup. Recovery preserves the login phone and requires no migration or SMS send.

## Doctor Analytics and Reports

`DoctorAnalyticsTab.jsx`, `doctorReport.js`, and `doctorController.js` share daily, weekly (Monday-based), and monthly date ranges. Analytics counts completed dental visits separately from manually entered clinical outcomes; do not infer BOHC/DMFT/clinical results from a completed visit alone.

- `GET /api/doctor/analytics` and `/report` accept `period=today|weekly|monthly` and optional `date=YYYY-MM-DD`. Windows use inclusive `from` and exclusive `until`.
- `GET /api/doctor/daily-report?date=YYYY-MM-DD` loads entries; `PUT` accepts `{ date, data }` with 24 barangay rows, each containing 24 nonnegative whole-number or `null` values. `GET /monthly-report?month=YYYY-MM` loads the month's saved reports.
- Preserve the 24 Bago City barangays and column layout in `doctorReport.js`. Blank (`null`) entries differ from explicit zero. Legacy 12-column rows are expanded without inventing counts.
- Completed-visit demographics preserve other/unknown sex and missing age/barangay details separately. Current profile changes can affect historical demographic summaries; unlinked visits fall back to the default dentist.
- Printable reports and dependency-free Excel exports use the same selected range and both clinical pages. Failed/stale loads or unsaved manual entries must block exports; failed saves must preserve input.

Admin BOHC forecasts come from `GET /api/admin/bohc-forecast`, which reads CSV files rather than training on requests. To regenerate the existing demonstration outputs from `server/`:

```bash
python -m pip install pandas statsmodels
python src/analytics/arima.py
```

The input is `src/analytics/bohc_modeling_dataset.csv`; outputs are `bohc_arima_forecasts.csv` (21 rows: seven age groups × 2026–2028) and `bohc_arima_backtest.csv` (63 validation rows). Forecast rows use `baseline_year`, `baseline_recipients`, `forecast_year`, `horizon`, and `forecast_recipients`; each horizon has its own intervals and validation scores. The API rejects missing/duplicate horizon/group combinations and mismatched baselines. Reports has a three-year total-demand chart and year selection for age-group forecasts, intervals, and performance.

Each age group has eight synthetic teaching observations from 2012–2019 and six observations labeled actual from 2020–2025. Synthetic totals use a linear backcast from 2020–2021, rounded and clipped at zero; validation therefore starts with training through 2021. Expanding training windows ending in 2021–2024 produce four one-year, three two-year, and two three-year tests per age group, scored separately. Every forecast uses only observations through its training cutoff; the last observed count is the baseline at every horizon. Blank male/female counts in actual rows mean zero recipients; annual totals remain the forecasting input. Preserve synthetic labels and present forecasts/scores as demonstrations. Run the model checks with `python -m unittest discover -s src/analytics -p test_arima.py` from `server/`, in addition to backend tests and `tests/admin-reports.spec.js` in the frontend.

## API Map and Implementation Patterns

All paths below are relative to `/api`; check the mounted route files before adding a client call.

| Prefix | Mounted capabilities |
| --- | --- |
| `/auth` | POST login/dev-login; GET me/profile; PATCH change-password |
| `/patients` | GET/PUT `/me` for patients; GET `/search`, GET `/:id`, POST `/:id/merge` and `/:id/account-recovery` for staff/admin (recovery requires a real session) |
| `/appointments` | Patient POST and GET me; doctor GET doctor; staff/admin GET list; staff/admin/doctor PATCH :id/status |
| `/queue` | Authenticated GET `/status`; patient GET `/me`, POST `/`, PATCH `/:id/cancel`; doctor/staff/admin GET `/`; staff/admin POST `/walkin`; doctor/staff POST `/call-next`, `/:id/recall`, `/:id/skip`, `/:id/return`; doctor/staff/admin PATCH `/:id/status` (presence excludes admin) |
| `/doctor` | Authenticated GET list/:id; admin-only GET `/:id/records` for profile and saved daily availability; doctor-only GET/PUT daily-settings, GET analytics/report/daily-report/monthly-report, PUT daily-report, POST consultations |
| `/admin` | Admin-only overview/bohc-forecast, staff and patient account management, specializations, SMS settings/jobs/replacement |
| `/health` | Public GET API status |

Some old service helpers reference unmounted logout, queue delete, appointment edit/cancel, or admin report routes. Their presence is not evidence of API support. The mounted appointment mutation is `PATCH /appointments/:id/status`, restricted to staff/admin/doctor.

### Frontend

Dashboard **Help** opens the shared native-dialog manual in `src/components/common/UserManual.jsx`, with role-specific instructions in `src/constants/userManuals.js` and annotated sample screenshots in `public/assets/manual/`. Keep these instructions aligned with working UI labels and current queue/account rules. Manual text uses a 16px minimum; preserve linked contents, keyboard access, mobile layout, and dashboard form state. `tests/user-manual.spec.js` covers all four roles with mocked API data.

Use shared `services/api.js`: its response interceptor returns `res.data` and rejects with `Error(message)`. Backend envelopes vary (`data`, raw array/object, `{ queue }`, or `{ queue, next_queue }`); inspect the actual endpoint shape instead of adding another unconditional `.data` unwrap. Existing dashboards use both service wrappers and direct shared-client calls.

Use `AuthContext`/`useAuth` for sessions, `useDashboardIdentity` for profile labels, shared constants for roles/states/services, and common components for controls. Tailwind 4 is loaded through `@tailwindcss/vite` and `@import 'tailwindcss'`; Poppins and existing CSS/inline brand styles supply the visual system. A legacy `tailwind.config.js` exists, but Vite does not explicitly load it. The active landing page is the cinematic component, not `pages/LandingPage.jsx`.

### Backend

Models are plain async objects using the mysql2 pool; controllers validate requests, invoke models/workflows, and return HTTP responses. Parameterize SQL values and allowlist dynamic identifiers. Multi-row workflows use a single acquired connection with commit/rollback/release; preserve category-before-ticket locking for queue mutations and sequence allocation. Keep SMS submission outside clinic transaction locks.

`server.js` mounts Helmet, configured CORS, 10kb JSON/urlencoded parsers, development bypass when enabled, route groups, health, 404, and the global error handler. The auth prefix has a 100-request/15-minute limiter. Protected routers apply `authenticate` and `authorize` explicitly; route order matters for fixed paths before `/:id`.

### Adding or Changing a Feature

1. Inspect existing callers, actual route permissions, response shapes, schema, and focused tests.
2. Add/change the model or shared workflow with validation, ownership checks, and transactions where needed.
3. Add the controller and route, placing fixed paths before parameter routes; mount a new prefix in `server.js` only when needed.
4. Update the frontend shared-client/service call, constants, UI state/errors, and affected role views.
5. Supply any required schema change explicitly; do not assume the missing historical SQL can bootstrap a database.
6. Run relevant backend/Node/browser checks and frontend lint/build for changed code. Document failures and verification limits rather than claiming mocked tests prove deployment behavior.
7. Update this guide and the related SMS/grace documentation when behavior or setup changes.

## Demo Cleanup

From `server/`, `node reset-test-data.js` deletes **all of today's queues** and their consultations, prescriptions, vital signs, medical records, and queue-alert SMS jobs. It also deletes today's appointments with reason `Same-day queue registration` and resets today's non-lock sequence counters. It retains the category `serving` lock rows.

This is for an explicitly intended demo database only. Stop the backend first so consultations, queue actions, and SMS cannot race the reset. The utility runs the cleanup in a transaction and rolls back on failure; rollback does not make a successful reset nondestructive. It does not reset every table, saved doctor report, or all SMS/account data.
