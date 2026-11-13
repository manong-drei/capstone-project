# CLAUDE.md

This file guides Claude Code and other coding assistants working on **E-KALUSUGAN**. It describes the current repository, not a proposed feature set. Last reviewed against the code: **2026-11-13**, including the uncommitted queue, walk-in contact, and SMS changes in the working tree.

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

- **Patient:** edit permitted profile details, recover a password by SMS, book dental appointments, request a dental ticket, monitor it, and cancel eligible tickets with a reason.
- **Doctor:** set daily availability/capacity, request leave, manage the dental queue, save consultations/prescriptions, review their patient history, and view/export analytics and reports.
- **Staff:** create and read patient appointment accounts (with in-person recovery in the Actions column, without account status or activation-password reissue controls), register walk-ins, search patient records, verify in-person account recovery, confirm presence/returns, manage the dental queue, and open the queue monitor.
- **Admin:** manage patient and staff/doctor/admin accounts, activation SMS, doctor leave decisions, queue oversight, patient history, audit logs, statistics, and notification settings.

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
    hooks/                        useAuth, useQueue, useLiveData, useDashboardIdentity
    context/AuthContext.jsx       Tab-local sessionStorage restoration and cleanup
    constants/                    Routes, roles, queue states/reasons, dental services
    utils/                        Queue/date display, name display helpers
    index.css                     Tailwind import; fonts loaded by route in App.jsx
  tests/                          Playwright browser tests and auth helper
  test/                           Node tests for report/export and name helpers
  playwright.config.js            Chromium tests; starts frontend automatically
  playwright.profile-layout.config.mjs Isolated Vite server on port 4312
  vite.config.js                  @/ alias, port 3000, /api proxy
  .github/workflows/playwright.yml Browser-test workflow
  DATA_SYNC.md                    Dashboard polling and draft-preservation guide

server/                           Express backend
  src/
    server.js                     Middleware, route mounts, startup, background workers
    config/                       MySQL pool, connection check, migration runners
    routes/                       auth, devAuth, patient, doctor, admin, queue, appointment
    controllers/                  HTTP validation and workflow handling; SMS/analytics
    models/                       User, Patient, Doctor, DoctorHistory, DoctorLeave,
                                  Staff, Appointment, Queue
    middleware/                   Auth/role/profile guards, IP limiting, request audit
    services/                     SMS/queue expiry workers, password recovery, audit log
    utils/                        Session, clinic dates, names/profile validation,
                                  pagination, phone, queue ordering, SMS, responses
    analytics/                    arima.py and BOHC history/forecast/backtest CSVs
  migrations/001_...008_*.sql       Incremental schema SQL, not a base-schema installer
  test/                           Node backend tests; optional MySQL grace check
  SMS_SETUP.md                    Detailed SMS deployment and recovery guide
  ACCOUNT_RECOVERY.md             SMS and in-person recovery; re-check current contracts
  DOCTOR_LEAVES.md                Leave request/approval and availability behavior
  AUDIT_LOGS.md                   Sanitized admin activity feed and migration guide
  QUEUE_GRACE_PERIOD.md           Missed-call lifecycle and API guide
  QUEUE_ORDERING.md               Priority FIFO, protected alternation, and return placement
  reset-test-data.js              Destructive demo-data cleanup utility

documentations/                   Local reference notes; ignored by Git
design/patient-profile/           Design brief and image-generation notes
tmp/                              Ignored local scripts, renders, and test artifacts
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
node --test test/doctorReport.test.js test/nameDisplay.test.js
```

- `dev`: Vite on port 3000; `@/` resolves to `src/`.
- `build`: production files in `dist/`; `preview` serves that build for local inspection.
- `test:e2e`: tests in `tests/`, using Chromium at `http://127.0.0.1:3000`; the config starts/reuses Vite. Protected-workflow tests stub API responses and use synthetic tokens.
- If Chromium is missing, install it with `npx playwright install chromium` before browser tests.
- Report/export and name-helper tests are separate from Playwright and have no npm script.
- For an isolated layout run, use `npm run test:e2e -- --config=playwright.profile-layout.config.mjs tests/patient-profile.spec.js`; its server uses port 4312 and does not reuse an existing Vite instance.
- The browser workflow is under `capstone-app/.github/workflows/`, not the repository-root `.github/workflows/`; do not assume GitHub runs it for this repository layout.

### Backend Commands — `server/`

```bash
npm ci
npm run dev
npm start
npm test
npm run test:db
```

- `dev` uses nodemon; `start` runs `src/server.js` directly. `npm start` does not automatically set `NODE_ENV=production`.
- `test` uses `node --test` and covers queue registration/order/lifecycle, walk-in records, SMS/auth/recovery, profiles, admin pagination/audits, doctor history/leave/analytics/reports, and cleanup.
- `test:db` checks the configured database; it is not a substitute for the test suite or schema setup.
- `queueGraceDb.test.js` skips by default. To run the optional database check in PowerShell from `server/`:

```powershell
$env:QUEUE_DB_TESTS = 'true'
node --test test/queueGraceDb.test.js
Remove-Item Env:QUEUE_DB_TESTS
```

That check needs the current `queues` and `queue_sequences` schema and uses isolated temporary tables. Default backend tests mock database/provider interactions; browser mocks do not validate live SQL or paid SMS delivery.

Other opt-in MySQL checks use `PATIENT_DB_TESTS=true` for `test/patientSearch.test.js`, `DOCTOR_DB_TESTS=true` for `test/doctorLeaves.test.js` and `test/doctorPatientHistory.test.js`, and `RECOVERY_DB_TESTS=true` for `test/passwordRecovery.test.js`. Enable only the intended check and clear the flag afterward; these checks use connection-local temporary tables.

## Environment and Hosting

### Frontend

The Axios client uses `/api` in development; Vite proxies it to `http://localhost:5000`. In production, set Vercel's `VITE_API_URL` to `https://ekalusugan-production.up.railway.app/api` for direct API requests, and Railway's `ALLOWED_ORIGINS` to the frontend origin, including `https://` and excluding the trailing slash. The client reads `VITE_API_URL` only in production builds. Direct requests let Railway identify the browser's IP for authentication rate limits.

Optional `capstone-app/.env.development`:

```dotenv
VITE_DEV_BYPASS=false
```

`VITE_DEV_BYPASS=true` shows the development login panel. Backend development bypass is configured separately. Restart Vite after local environment changes. Vercel provides a SPA route fallback and a same-origin `/api` rewrite when `VITE_API_URL` is unset.

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
- The pool allows 10 connections, uses mysql2 date conversion `+08:00`, and initializes each acquired connection with `SET SESSION time_zone = '+08:00'` before use. Preserve both so `CURDATE()`, `CURTIME()`, and `NOW()` agree with clinic dates. Use `utils/clinicDate.js` for Manila calendar dates and strict date validation.
- Production requires `NODE_ENV=production`, real allowed origins, HTTPS, and appropriate database credentials. Development mock access must be disabled.
- No `server/.env.sms.example` is present in this checkout; use the placeholders above and check `utils/sms.js`. `SMS_ENCRYPTION_KEY` is 32 random bytes encoded as 64 hex characters and must stay stable while encrypted jobs/recovery codes are pending. Patient creation needs it even with `SMS_ENABLED=false`.
- `RAILWAY_DEPLOYMENT_ID` switches `middleware/rateLimitByIp.js` to the validated edge-supplied `X-Real-IP`, falling back to `req.ip`; elsewhere it uses the normal Express IP policy. Do not enable broad forwarded-header trust to work around rate limits.

Generate an SMS encryption key locally when configuring the environment:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

## Database and Migrations

There is no ORM migration framework or complete base-schema installer in this checkout. The application expects an existing schema. Relevant tables include:

- Accounts/profiles: `users`, `patients`, `doctors`, `staff`, `specializations`, `patient_audit`.
- Scheduling/queue: `appointments`, `queues`, `queue_sequences`, `daily_doctor_settings`, `doctor_leaves`.
- Clinical/reporting: `consultations`, `prescriptions`, `vital_signs`, `medical_records`, `doctor_daily_reports`.
- SMS/recovery: `sms_settings`, `sms_jobs`, `sms_password_audit`, `password_recoveries`.
- Admin activity: `audit_logs`; a recognized pre-existing audit table may be archived as `audit_logs_legacy` by the audit migration.

Names live in `patients`, `doctors`, and `staff` (including admin profiles), while `users` stores account credentials. `middle_name` and `suffix` are optional, trimmed strings of up to 100 and 20 characters. Blank values clear them; omitted update fields preserve existing values. Full names display as first, middle, last, suffix.

All the following scripts are defined in `server/package.json`. SQL migrations `001` through `008` are present; they extend an existing application database and cannot create the whole database from scratch.

| Command from `server/` | Purpose and current prerequisite |
| --- | --- |
| `npm run migrate:queue-sequences` | `001_queue_sequences.sql`: daily sequence/category lock table; creates it if absent |
| `npm run migrate:queue-status-reason` | `002_queue_status_reason.sql`: adds cancellation/status reason; run once |
| `npm run migrate:walkin-patients` | `003_walkin_patients.sql`: persistent walk-in records, legacy backfill, queue foreign-key changes; run once after 001/002 |
| `npm run migrate:doctor-daily-reports` | `004_doctor_daily_reports.sql`: creates the saved daily report table if absent |
| `npm run migrate:sms` | Runs the present `migrations/005_sms_notifications.sql`; requires the earlier schema |
| `npm run migrate:user-names` | Adds optional `middle_name VARCHAR(100)` and `suffix VARCHAR(20)` to `patients`, `staff` (including admins), and `doctors`, and widens `queues.walk_in_name` to fit complete names; safe to rerun |
| `npm run migrate:queue-no-show` | Inline SQL expands the queue status enum; requires `queues` |
| `npm run migrate:queue-grace` | Inline SQL adds grace/call timestamps, count, expiry index, and historical call backfill; designed to be rerunnable |
| `npm run migrate:queue-appointments` | Adds nullable `queues.appointment_id` with `ON DELETE SET NULL`; backfills only unique same-day queue/appointment pairs where the booking already existed |
| `npm run migrate:walkin-doctor` | Adds nullable `queues.completed_by_doctor_id` for treating-dentist attribution |
| `npm run migrate:sms-reviews` | Adds nullable `sms_jobs.reviewed_at` for acknowledging failures |
| `npm run migrate:audit` | `006_admin_audit_logs.sql`: creates the current audit table/indexes; preserves a recognized old table as `audit_logs_legacy`, refuses unsafe replacement |
| `npm run migrate:doctor-leaves` | `007_doctor_leaves.sql`: creates doctor leave requests; preserves bookings and daily settings |
| `npm run migrate:password-recovery` | `008_password_recovery.sql` plus inline changes to SMS purposes/recovery ID; requires SMS and audit schema first; rerunnable |
| `npm run migrate:prescription-text` | Widens `prescriptions.medication_name` to `TEXT NOT NULL` for free-text recommendations |

Back up the target database and stop the API before schema changes. Obtain the base schema from the project owner/approved database backup when needed; do not blindly rerun every script. MySQL DDL is not transactional. The status-reason and walk-in migrations are not general-purpose rerunnable installers. The SMS runner refuses a second or partially started application; inspect schema after a failure before retrying. Apply the relevant queue grace/appointment/doctor-attribution, SMS review, audit, leave, recovery, and prescription migrations before using their updated workflows.

The SMS migration preserves permanent password hashes, expires legacy temporary credentials, and adds credential-version checks that require older sessions to log in again. Existing serving tickets remain serving during the grace migration.

## Authentication and Routing

1. Login accepts `{ phone, password }` at `POST /api/auth/login`. Normalize Philippine mobile inputs with `utils/phone.js`: `09xxxxxxxxx`, `+639xxxxxxxxx`, and `639xxxxxxxxx` become the stored `09xxxxxxxxx` form. Username login is disabled.
2. `User.authenticate()` locks the account row, checks active status/credential expiry, verifies the bcryptjs hash, and issues a session. Five failed attempts lock the account for 15 minutes.
3. The frontend stores `ek_token` and `ek_user` in **sessionStorage**, isolating accounts by tab and preserving refreshes. `AuthContext` deletes legacy localStorage credentials/drafts, synchronously restores valid unexpired claims, tolerates an incomplete user cache, and derives role/setup state from the token. Axios reads this tab's token. Missing/replaced session storage is checked every second and on focus, clears session/drafts, and returns to `/`. Decoding restores the UI; backend signature/access verification remains authoritative.
4. Axios attaches `Authorization: Bearer <token>`. `authenticate.js` verifies JWTs and rechecks the active account, current role, and `credential_version` on normal requests.
5. Temporary-password login consumes that credential once and issues a `purpose: 'password_setup'` JWT. Until setup completes, only `GET /api/auth/me` and `PATCH /api/auth/change-password` are allowed; the frontend redirects to `/change-password`.
6. Setup accepts `{ newPassword }`; a normal password change also requires `oldPassword`. The new password needs at least 8 characters, a digit, and at most 72 UTF-8 bytes, and must differ from the old password. Success increments the credential version and returns a replacement `token` and `user`; persist both.
7. `GET /api/auth/profile` returns the normalized role profile used by `useDashboardIdentity` and the shared profile menu. `AuthContext.logout()` clears local state; there is no mounted backend logout route.

### Profile Editing

`MyProfile.jsx` serves all four roles. Patients update through `PUT /api/patients/me`; doctor/staff/admin use `PATCH /api/auth/profile`. Both require a real `purpose: 'session'` identity through `requireProfileSession`; development/setup identities cannot edit. `utils/profile.js` rejects empty payloads and unknown fields. Common editable fields are first/middle/last name, suffix, and contact number; patients additionally allow barangay/city, PhilHealth ID, and emergency contact fields. The current UI edits common fields plus patient barangay/city. Contact edits do not change `users.phone`, the registered login number. Role, birthday, sex, priority eligibility, and account credentials are not profile-edit fields. Preserve drafts and errors during failed saves/background refreshes.

### Frontend Routes

| Frontend path | Access/behavior |
| --- | --- |
| `/` | Public cinematic landing page |
| `/experimental` | Redirects to `/` |
| `/login` | Public phone/password login |
| `/dashboard` | Protected redirect to the user's dashboard |
| `/change-password` | Protected password setup/change page |
| `/patient`, `/doctor`, `/staff`, `/admin` | Corresponding role only |
| `/patient/my-queue`, `/patient/appointment-history` | Patient queue line and appointment/visit details |
| `/patient/profile`, `/doctor/profile`, `/staff/profile`, `/admin/profile` | Role-specific profile editing and security links |
| `/patient/profile/change-password` | Patient password-change route; forced setup still uses `/change-password` |
| `/staff/accounts/patients`, `/staff/walk-ins/new`, `/staff/account-recovery`, `/staff/patients/:id` | Staff forms and staff/admin patient record access; `/staff/account-recovery` redirects to Patient Accounts |
| `/doctor/analytics`, `/doctor/patient-history`, `/doctor/patients/:id`, `/doctor/consultations/:id`, `/doctor/reports/daily`, `/doctor/leave-requests` | Doctor analytics, scoped history/notes, daily entries, and leave requests |
| `/admin/analytics`, `/admin/doctors`, `/admin/doctors/:id/records`, `/admin/leave-requests`, `/admin/leave-requests/:id` | Admin analytics, doctor records and leave review |
| `/admin/patient-history`, `/admin/patients/:id`, `/admin/notifications`, `/admin/accounts/staff`, `/admin/accounts/patients`, `/admin/audit-logs` | Admin history, SMS, account management, and audit feed |
| `/admin/accounts`, `/admin/queue` | Redirect to staff accounts and admin overview, respectively |
| `/general-queue-monitor` | Staff/admin kiosk; currently displays the dental queue despite its name |

`/register` and `/patient/notifications` are not active routes. Dashboard sections use nested URLs and search parameters so record/date/filter views survive direct navigation and refresh; use `constants/routes.js` and `dashboardNavigation.js`. Unknown routes redirect to `/`. Backend `authorize(...roles)` accepts separate role arguments, for example `authorize('doctor', 'staff')`.

### Development Access

Both backend bypass mechanisms require `NODE_ENV=development`:

- Header: `x-dev-role: patient | doctor | staff | admin`. `devBypass` runs before protected routers and injects a mock identity.
- Route: `POST /api/auth/dev-login` with `{ "role": "patient" }` returns a signed JWT with `purpose: 'development'`; outside development it returns 404.

Mock identities are not provisioned database records. The header mocks use `id`, while production controllers generally need `user_id`; bypass login does not guarantee every database-backed workflow works. Use real test accounts or the existing API-mocked browser fixtures for those flows.

## Queue and Patient Workflows

### Registration, Numbers, and Ordering

- Patient ticket registration creates **dental** tickets only. Current service IDs are `CONSULTATION` and `TOOTH_EXTRACTION`. Both `GetQueueModal` and the staff walk-in form select exactly one service; the backend still accepts up to two distinct allowlisted IDs. Keep `constants/medicalServices.js` aligned with `queueController.js`; older saved service values are historical data, not current registration options.
- Priority requests require recorded eligibility; categories are `senior`, `pwd`, and `pregnant`, with expiry checked for patient self-queueing.
- A patient can have one active dental ticket and at most two dental registrations per day. Active states are `waiting`, `called`, `serving`, and `missed`; terminal `no_show` does not itself block a new eligible ticket.
- Registration uses the dentist on an existing same-day appointment, otherwise the active doctor account with the lowest `doctor_id`, and checks approved leave, daily availability, and appointment capacity. The appointment default/max is 10; dental walk-in capacity defaults to 0 (no configured cap) and has a maximum setting of 999.
- Registration stays open after the first dental call, subject to existing dentist availability, capacity, active-ticket and daily limits. Patient queue status retains a nullable `registration_message`; starting service does not populate it with a closure notice.
- Without an active same-day appointment, self-queueing creates a confirmed appointment with the exact reason `Same-day queue registration` in the registration transaction.
- New patient tickets store the exact `appointment_id`. Completion/cancellation updates only that linked pending/confirmed appointment; do not broadly update every booking for the patient/day. Repeated booking of the same non-cancelled patient/doctor/date/time returns the existing appointment before adding another capacity slot.
- Current numbers come from `Queue.nextQueueNumber()` and locked daily `queue_sequences`, not the unused `utils/generateQueueNumber.js`.

| Ticket source | Regular example | Priority example |
| --- | --- | --- |
| Dental appointment/patient | `AQ01` | `AP01` |
| Dental walk-in | `Q01` | `P01` |
| General walk-in | `G-001` | `G-001` (same general sequence) |

Dental tickets have four independent daily counters: `appointment_regular` (`AQ`), `appointment_priority` (`AP`), `walk_in_regular` (`Q`), and `walk_in_priority` (`P`). Four walk-ins do not advance either appointment counter: the first regular appointment is `AQ01`, and the first priority appointment is `AP01`. New counters start after the highest number already issued today with the same prefix, including cancelled/completed tickets; existing tickets keep their numbers. The existing `queue_sequences.sequence_type` VARCHAR(20) supports these keys without a migration. General tickets retain one shared `general` counter. `queueOrder.projectQueue()` selects verified priority tickets FIFO across sources, then alternates regular sources subject to older first-turn walk-in protection. Confirmed returns rejoin behind existing entries in their priority group using `returned_at`. Entry timestamps and ID break ties; displayed numbers never determine precedence. Clinic displays, call-next, estimates and SMS positions use that shared projected order. See `server/QUEUE_ORDERING.md` for the algorithm and examples.

### Call, Presence, Missed Turn, and Return

- Call-next changes `waiting → called`; only one called/serving ticket may occupy a category. Staff/doctor confirms physical presence for `called → serving`.
- Recall is available 15 seconds after the first call. Skipping requires two calls and another 15 seconds after the second.
- The first skip changes the ticket to `missed`, starts a 10-minute grace period, and calls the next ticket in the same transaction.
- Staff/doctor records an arrival before the deadline through the return action. The same ticket becomes `waiting` and rejoins behind patients already waiting in its priority group, ordered by return time; it does not interrupt a called/serving patient.
- An expired grace window or a second missed turn after returning ends as `no_show`. Terminal tickets cannot be revived. The queue expiry worker runs at startup and every five seconds independently of SMS; ticket actions also check expiry under the category lock.
- The generic status endpoint accepts presence, completion (`serving → done`), and cancellation. Recall/skip/return use their dedicated endpoints. Admins cannot confirm presence.
- Cancellation requires a reason. Patients may cancel their own `waiting` or `missed` ticket; staff/doctor/admin can cancel an eligible active ticket. Registered-patient cancellation/completion also updates the associated appointment status.
- Staff can finish a check-up and call the next patient while a doctor completes the previous notes. Consultation saving accepts eligible same-day serving/done tickets and protects duplicate clinical writes under the shared ticket transaction. Repeating `done` on a completed ticket is idempotent; completion and consultation saving are separate operations.
- Dental walk-in completion records `completed_by_doctor_id` from saved notes, the completing doctor's active profile, or the sole available dentist for staff completion. If several dentists are available and no notes identify one, attribution can remain null. Later notes cannot switch an already attributed walk-in to another doctor.

Keep Manila deadline formatting in `utils/queueDisplay.js` and recovery instructions in the common queue components. See `server/QUEUE_GRACE_PERIOD.md` for detailed behavior.

`GET /api/queue/me` includes `wait_estimate` for waiting tickets: minutes, patients ahead, and completed-visit sample count. It uses the shared projected queue order and today's mean call-to-completion time (15 minutes per patient until valid samples exist), subtracting elapsed time for the current patient with a one-minute minimum remaining. Patient Home uses the shared five-second refresh, labels the fallback, and replaces the number with instructions for called, serving, missed, unavailable-doctor, and failed-update states. These are rough estimates; no service-duration schema change is required.

**My Queue** shows the backend's ordered `line` even without a personal ticket and highlights the patient's ticket when present. `QueueStatus.jsx` displays a responsive floating ticket that can minimize to **My ticket** without cancelling it. Appointment history uses exact ticket/appointment links for services, cancellation reasons, and completed consultation recommendations; legacy unlinked clinical details appear only when the patient/dentist/day pairing is unambiguous.

### Walk-In Records

Staff/admin `POST /api/queue/walkin` can create dental or general tickets. General tickets use `GENERAL_CONSULTATION`; current staff dashboard and kiosk controls focus on dental.

Walk-ins are persistent `patients` records with nullable `user_id`, not anonymous queue-only names. Registration validates demographics/address/contact options, searches possible matches, supports selecting `patient_id`, and requires `create_new_confirmed: true` to override a possible duplicate. Priority tickets require a category; patients aged 60 or older are automatically assigned senior priority using their birthday in Manila. Patient updates, new records, and queue activity create `patient_audit` entries.

`WalkInForm.jsx` supports **Patient has no mobile number**. The request must send the boolean `no_mobile: true` to waive the usual valid `contact` requirement. Optional `alternate_contact` is a validated guardian/companion mobile, stored in `patients.emg_contact_no` and the ticket's `walk_in_contact`; new no-mobile patients have a null personal contact. Selecting an existing patient preserves their stored personal/emergency contact unless a replacement is supplied. An alternate number is not the patient's login phone and is not used for duplicate matching. With neither number, the ticket's SMS alert is permanently suppressed and staff instruct the patient to stay nearby. This uses existing nullable contact columns, with no new migration.

Staff/admin can search `/api/patients/search` and view `/api/patients/:id`. Phone lookup matches consecutive digits anywhere in a saved patient/account contact after at least four digits, accepts complete local/international formats, ranks exact full-number matches first, and returns at most 20 unarchived records with masked contacts and search audit entries. The walk-in form applies the four-digit threshold to both its patient lookup and contact field; a supplied registration number must still be a complete valid mobile. Set `PATIENT_DB_TESTS=true` when running `node --test test/patientSearch.test.js` to verify matching in isolated temporary MySQL tables. `POST /api/patients/:id/merge` requires a different `target_patient_id` and `confirm: true`; only an unarchived walk-in source without a user account may merge into an unarchived target, and conflicting active tickets must be resolved first. The implementation reassigns queue history, archives the source, and writes audit entries; do not assume it also rewrites every clinical/SMS association.

### Queue Monitor

`GeneralQueueMonitor.jsx` polls the dental queue every second and refreshes immediately on the payload-free `QUEUE_UPDATES_CHANNEL`. It preserves backend ordering, prevents overlapping requests, aborts requests on unmount, and uses a five-second request timeout. `GET /api/queue?category=dental&include_clock=1` returns `{ data, server_time }` with `Cache-Control: no-store`; the normal queue list remains a raw array. The kiosk derives its Manila clock/grace countdown from server time plus `performance.now()` rather than trusting the device clock after synchronization. Its new tab inherits the opening session and disconnects `window.opener`.

Announcements require user activation and browser Web Speech support. They announce calls/recalls, stay quiet on repeated polls/presence changes, and use recognized female English voices, preferring `en-PH`. Missing voices or speech errors show recovery instructions while the visual monitor remains usable. Keep keyboard access, responsive layout, and reduced-motion support intact.

## SMS Notifications and Account Activation

Implementation: `services/smsNotifications.js`, `utils/sms.js`, `controllers/smsController.js`, and the admin Notifications/patient management components. Read `server/SMS_SETUP.md` before changing delivery or activation behavior.

- Admin-created patient accounts receive a cryptographically random six-digit temporary password through an encrypted MySQL outbox. Account creation and the queued password job commit together; responses contain `sms_job_id`/`sms_status`, never a plaintext password.
- SMS temporary credentials expire 72 hours after first submission, including rejected submission; retries do not extend expiry. Expired/lost setup sessions can use the existing admin SMS replacement or in-person staff/admin recovery.
- `sms_settings.threshold` defaults to 5 and accepts integers 1–100. Initial positions within the threshold are permanently `suppressed` and must stay nearby; positions farther back are `armed` and enqueue an alert when they reach the threshold. Staff must relay the walk-in registration notice.
- Eligibility rechecks current-day waiting status, account/patient association, active/unarchived records, and the registered or confirmed matching walk-in contact. A walk-in ticket's contact must match the normalized personal contact or `emg_contact_no`; a ticket with no contact cannot receive an alert. Queue alerts include no patient name, diagnosis, or service details.
- With `SMS_ENABLED=true`, the worker validates provider configuration, initializes existing waiting tickets, runs every five seconds, and wakes after relevant changes. MySQL advisory/category/account locks and durable job claims coordinate delivery; network requests occur outside clinic-action locks.
- Pending bodies use AES-256-GCM. Clear bodies on submission, failure, cancellation, or uncertainty; expose only masked recipients/statuses to the UI. Keep keys and message bodies out of logs.
- Semaphore requests use the approved alphanumeric sender, one recipient, and at most 160 ASCII characters. Certain connection/429 failures retry with bounded attempts; ambiguous submissions become `unknown` and are never automatically resent. Check provider history before replacing a credential. Provider `sent` does not mean the patient read the SMS.

Admin interfaces: `GET/PUT /api/admin/sms-settings`, `GET /api/admin/sms-jobs` (latest 100 jobs), `PATCH /api/admin/sms-jobs/:id/review`, and `POST /api/admin/patients/:user_id/temporary-password` with `{ identity_confirmed: true }`. Reviewing a failed/refunded delivery records `reviewed_at` without resending it or changing its original update time. The dashboard's failed-SMS badge counts unreviewed failures. Queue alerts have no manual resend action.

### Patient SMS Password Recovery

Login's **Forgot password?** opens `PasswordRecoveryDialog.jsx`: registered phone, four-digit SMS code, then a new password. Public endpoints under `/api/auth/password-recovery/` are POST `request` with `{ phone }`, `verify` with `{ recovery_id, otp }`, and `reset` with `{ recovery_id, reset_token, newPassword }`; all return `Cache-Control: no-store`. `otp` is a four-character string so leading zeros survive. A valid request returns a recovery ID, `expires_in: 300`, and `resend_after: 60`. Unknown/inactive/non-patient/unlinked numbers and per-number issuance throttles return the same generic success-shaped response without sending SMS; malformed phone input returns 400. Do not copy the older account-enumerating response described in `ACCOUNT_RECOVERY.md`.

- Requires SMS enabled and the SMS/audit/password-recovery migrations. Codes expire five minutes after issuance, including delivery time. At most three codes per number are issued per rolling 15 minutes, with a 60-second resend cooldown; a resend cancels earlier pending codes/reset grants.
- Three wrong guesses close a challenge. Per-IP limits are 10 requests, 20 verifications, and 10 resets per 15 minutes, alongside the global auth limiter. Number/guess limits persist in MySQL; IP counters are per API instance.
- Verification consumes the code once and returns a five-minute reset token held only in dialog memory. OTPs use keyed hashes, reset tokens are hashed, and queued SMS payloads are encrypted. Neither code request nor verification changes the existing password or sessions.
- Reset uses the normal password rules, rejects the current password, atomically rotates the credential version, clears lockout/temporary credentials, cancels stale credential SMS jobs/grants, and audits completion. Prior sessions become invalid; the patient returns to login. The SMS worker reconciles expiry, account changes, and delivery failure while enabled.

### Staff-Assisted Account Recovery

Staff open **Account recovery** from their dashboard, and admins open it from patient management when SMS recovery is unavailable. The patient profile exposes safe nullable `account` metadata to staff/admin: registered login phone, active status, and credential version. Birthdays are displayed in Philippine time. `server/ACCOUNT_RECOVERY.md` provides background but its six-flag verification contract is outdated; the current controller and UI below are authoritative.

`POST /api/patients/:id/account-recovery` requires a real staff/admin session, numeric `expected_credential_version`, `confirmed_phone` matching the registered login number, and the operator's `staff_password`. The server rechecks that password and the operator's active role/current credential version on issuance. `POST /api/patients/:id/account-recovery/verify-password` accepts `{ staff_password }` as a separate check and never issues a patient credential. Development bypass identities cannot use either endpoint. Issuance is limited to 10 requests per authenticated operator per 15 minutes per API instance; the password-check endpoint separately limits failed checks to 10.

The transaction locks the patient and account, validates eligibility, complete identity fields, phone and version, stores a bcrypt hash with a 30-minute expiry, increments the credential version, resets lockout/redemption state, cancels queued/submitting temporary-password SMS jobs, and writes a sanitized `patient_audit` entry (plus admin audit when applicable). Only the successful issuance response exposes the generated password, with `Cache-Control: no-store`. The UI holds it in memory and clears it on close, expiry, or navigation. Login consumes it once and requires the existing 15-minute password setup. In-person recovery preserves the login phone and sends no SMS; it uses the existing credential/patient-audit schema plus the audit infrastructure for admin issuance.

## Doctor Leave and Patient History

`DoctorLeave.js`, `doctorLeaveController.js`, `DoctorLeaveModal.jsx`, and `AdminLeaveRequestsTab.jsx` implement inclusive Manila date ranges. Doctors GET/POST `/api/doctor/leave-requests` and PATCH `/:id/withdraw`; admins GET `/api/admin/doctor-leaves`, GET `/:id` impacts, and PATCH `/:id` decisions. Reasons/review notes are optional and capped at 500 characters; reasons are private to the doctor/admin endpoints. New requests start pending, overlapping pending/approved requests are rejected, and doctors can withdraw only their own pending requests.

Only approved leave blocks new bookings, self-queue tickets, and dental walk-ins. Admin approval with affected bookings/tickets requires `acknowledge_conflicts: true` and the current `impact_version`; approval rechecks impacts under the dental-category/doctor locks and rejects stale reviews. Admins can reject pending leave or cancel approved leave. Existing bookings/tickets/notes are preserved for staff follow-up and no rescheduling/cancellation SMS is sent. Daily availability cannot override approved leave; its underlying setting survives, and normal rules resume after leave ends without a reset job. Shared availability exposes `leave_end`, not private reasons. See `server/DOCTOR_LEAVES.md`; leave decisions live in `doctor_leaves`, not the current admin audit feed.

Doctors GET `/api/doctor/patient-history` for a combined queue/bookings history scoped to their doctor profile, and `/api/doctor/consultations/:id` for their own saved notes/prescriptions. `DoctorHistory.js` avoids showing a linked booking twice. Doctors can also GET `/api/patients/:id` only when their scoped history contains that patient; the response includes their visits and `account: null`, with no staff recovery/merge controls. Clinical record reads use `Cache-Control: no-store`.

`ConsultationModal.jsx` collects required remarks (`notes`) and optional `diagnosis`/free-text `prescription`. While a patient is serving, **Save Consultation** stores a draft under `ek_remarks_drafts` in sessionStorage, scoped to the doctor and ticket. Marking complete first finishes the queue, then posts any draft to `/api/doctor/consultations`, then calls next. These are separate requests: a note-save failure can leave the ticket done, so retain the draft for retry. Notes for a finished ticket save directly. The backend writes remarks to `consultations.chief_complaint`, optional diagnosis to `diagnosis`, and recommendations to `prescriptions.medication_name`; it does not finish the queue when saving notes. Keep the prescription `TEXT` migration and truncation/rollback check intact.

## Admin Management and Audit Logs

Patient account listing is paginated: `GET /api/admin/patients` accepts `page` (default 1), `limit` (default 10, max 100), `search` (up to 150 characters), and `includeInactive=true|false`; returns `{ success, patients, pagination }`. Search matches name/contact/barangay. `GET /api/appointments` for staff/admin also returns pagination and summary counts; admin-only `includeWalkIns=true` combines appointments and walk-in visits. Keep repeated visits and walk-ins distinct from unique patients. In `/admin/overview`, the legacy `totalPatients` field counts queue records, `totalDoctors` counts active doctor accounts, and `volumeDaily`/`dentalAgeGroups` derive from queue history.

`GET /api/admin/audit-logs` is read-only and admin-only, returning `{ success, events, pagination }` with `Cache-Control: no-store`. Filters: `page`, `limit` (default 20, max 100), inclusive Manila `dateFrom`/`dateTo`, `actor` (literal name or exact ID), allowlisted `action`, and `outcome=success|failed|denied`. Events are stored/serialized in UTC and displayed in Manila time.

`services/auditLog.js` and `middleware/auditRequest.js` retain account creation/activation changes, password issuance/replacement, SMS recovery completion/failure, patient merge/duplicate overrides, SMS threshold changes, admin sign-ins, and access denials. Normal activity records require a verified admin; forced recovery/denial events have their own actor rules. Routine record views/profile edits, queue/appointment actions, and leave decisions are not part of this feed. Successful audited mutations commit with their audit rows; rejected requests and sign-ins use separate/best-effort recording. `patient_audit` read failures are best effort, while mutation audit failures roll back writes. Never record passwords, OTPs, tokens, medical text, raw bodies, or the operator's password; details are explicitly sanitized. No audit edit/delete/export/retention API exists. See `server/AUDIT_LOGS.md` and watch for `Audit recording failed.` / `Patient access audit recording failed.` when assessing history completeness.

## Doctor Analytics and Reports

`DoctorAnalyticsTab.jsx`, `doctorReport.js`, and `doctorController.js` share daily, weekly (Monday-based), and monthly date ranges. Analytics counts completed dental visits separately from manually entered clinical outcomes; do not infer BOHC/DMFT/clinical results from a completed visit alone.

- `GET /api/doctor/analytics` and `/report` accept `period=today|weekly|monthly` and optional `date=YYYY-MM-DD`. Windows use inclusive `from` and exclusive `until`.
- `GET /api/doctor/daily-report?date=YYYY-MM-DD` loads entries; `PUT` accepts `{ date, data }` with 24 barangay rows, each containing 24 nonnegative whole-number or `null` values. `GET /monthly-report?month=YYYY-MM` loads the month's saved reports.
- Preserve the 24 Bago City barangays and column layout in `doctorReport.js`. Blank (`null`) entries differ from explicit zero. Legacy 12-column rows are expanded without inventing counts.
- Completed-visit demographics preserve other/unknown sex and missing age/barangay details separately. Current profile changes can affect historical demographic summaries; unlinked visits fall back to the default dentist.
- Printable reports and dependency-free `.xlsx` exports use the same selected range and both clinical pages. The workbook has two report sheets with print areas, landscape Letter paper, and one-page fit per sheet. Failed/stale loads or unsaved manual entries must block exports; failed saves must preserve input. Keep the ZIP/XML exporter and focused report tests rather than adding a spreadsheet dependency.

Admin BOHC forecasts come from `GET /api/admin/bohc-forecast`, which reads CSV files rather than training on requests. To regenerate the existing demonstration outputs from `server/`:

```bash
python -m pip install pandas statsmodels
python src/analytics/regenerate_synthetic.py
python src/analytics/arima.py
```

The input is `src/analytics/bohc_modeling_dataset.csv`; outputs are `bohc_arima_forecasts.csv` (21 rows: seven age groups × 2026–2028), `bohc_arima_backtest.csv` (63 validation rows), and `bohc_arima_holdout.csv` (14 fixed-holdout rows: seven groups × 2024–2025). Forecast rows use `baseline_year`, `baseline_recipients`, `forecast_year`, `horizon`, and `forecast_recipients`; each horizon has its own intervals and validation scores. `selected_arima_trend` is `t` for drift or `n` for no drift, displayed with the model order. The API rejects missing/duplicate horizon/group combinations and mismatched baselines. Reports has a three-year total-demand chart and year selection for age-group forecasts, intervals, and performance.

Each age group has eight synthetic teaching observations from 2012–2019 and six observations labeled actual from 2020–2025. `regenerate_synthetic.py` changes only the synthetic rows: fixed independent starting volumes, group-specific 3–4% compound annual growth trends, and reproducible level variations up to ±2.5%, including a slight annual decline. Its fixed seeds and assumptions do not use any recorded counts; the generator preserves all 42 recorded rows. The first and last synthetic level variations are zero, so the overall growth stays at approximately 3–4% after integer rounding; individual annual changes vary. Starting volumes are simulation assumptions, not estimates of the missing facility history. Rerun the generator only when intentionally resetting the synthetic fixture; `arima.py` never changes history.

ARIMA uses first differences (`d=1`, chosen up front for the changing annual levels), then compares `(0,1,0)`, `(1,1,0)`, and `(0,1,1)`, each with and without drift, using the lowest finite AICc among converged fits. AICc comparisons keep the same differencing order; do not force positive forecast growth. Expanding training windows ending in 2021–2024 still produce four one-year, three two-year, and two three-year tests per age group, so scores remain comparable with the previous demo. The separate fixed holdout selects a model using data through 2023 and forecasts 2024–2025 without seeing either held-out observation; those rows are exported from the corresponding rolling origin. Candidate rules and synthetic settings are fixed, not tuned against holdout scores. Final 2026–2028 forecasts refit using all 14 observations. Every validation forecast uses only observations through its training cutoff; the last observed count is the baseline at every horizon. Historical breaks remain and synthetic rows do not establish real-world accuracy. Blank male/female counts in actual rows mean zero recipients; annual totals remain the forecasting input. Preserve synthetic labels and present forecasts/scores as demonstrations. Run the model checks with `python -m unittest discover -s src/analytics -p test_arima.py` from `server/`, in addition to backend tests and `tests/admin-reports.spec.js` in the frontend.

## API Map and Implementation Patterns

All paths below are relative to `/api`; check the mounted route files before adding a client call.

| Prefix | Mounted capabilities |
| --- | --- |
| `/auth` | Public POST login, password-recovery/request, password-recovery/verify, password-recovery/reset; POST dev-login in development only; protected GET me/profile; PATCH profile (doctor/staff/admin real session), change-password |
| `/patients` | Patient GET/PUT `/me` (update requires real session); staff/admin GET `/search`, POST `/:id/merge`; staff/admin/doctor GET `/:id` (doctor-scoped visits); staff/admin real-session POST `/:id/account-recovery` and `/:id/account-recovery/verify-password` |
| `/appointments` | Patient POST and GET me; doctor GET doctor; staff/admin GET list; staff/admin/doctor PATCH :id/status |
| `/queue` | Authenticated GET `/status`; patient GET `/me`, POST `/`, PATCH `/:id/cancel`; doctor/staff/admin GET `/`; staff/admin POST `/walkin`; doctor/staff POST `/call-next`, `/:id/recall`, `/:id/skip`, `/:id/return`; doctor/staff/admin PATCH `/:id/status` (presence excludes admin) |
| `/doctor` | Authenticated GET list/:id; admin GET `/:id/records`; doctor GET/PUT daily-settings, GET analytics/report/daily-report/monthly-report/patient-history, GET consultations/:id, PUT daily-report, POST consultations, GET/POST leave-requests, PATCH leave-requests/:id/withdraw |
| `/admin` | Admin-only overview/bohc-forecast, staff/patient account management, specializations, SMS settings/jobs/replacement and PATCH sms-jobs/:id/review, GET audit-logs, GET doctor-leaves and doctor-leaves/:id, PATCH doctor-leaves/:id |
| `/health` | Public GET API status |

Some old service helpers reference unmounted logout, queue delete, appointment edit/cancel, or admin report routes. Their presence is not evidence of API support. The mounted appointment mutation is `PATCH /appointments/:id/status`, restricted to staff/admin/doctor.

### Frontend

Mounted dashboard loaders use `useLiveData` with a stable `useCallback` and the shared `services/dataSync.js` timer: refresh every five seconds, on focus/visibility/online, and after successful mutations from the shared Axios client. The `ekalusugan-data-updates` BroadcastChannel carries only a change signal, never accounts or patient data. Hidden/offline tabs pause background refreshes; other devices are detected by polling. Loaders do not overlap, obsolete requests are aborted, and background updates preserve drafts rather than replacing them. Walk-in selections/recovery verification remain snapshots checked again by the server. The kiosk has its separate one-second queue poll/channel. See `capstone-app/DATA_SYNC.md` and `tests/live-data-sync.spec.js`.

Dashboard **Help** opens the shared native-dialog manual in `src/components/common/UserManual.jsx`, with role-specific instructions in `src/constants/userManuals.js` and annotated sample screenshots in `public/assets/manual/`. Keep these instructions aligned with working UI labels and current queue/account rules. Manual text uses a 16px minimum; preserve linked contents, keyboard access, mobile layout, and dashboard form state. `tests/user-manual.spec.js` covers all four roles with mocked API data.

Patient Home also opens the short `DentalQueueGuide.jsx` dialog. Reuse the shared `LoadingState.jsx` skeleton/page placeholders, `AuthPageLayout.jsx`, lazy manual, profile menu, and dashboard navigation. Preserve focus restoration, accessible form errors/first-invalid-field focus, reduced motion, and mobile layouts when changing these flows.

Use shared `services/api.js`: its response interceptor returns `res.data` and rejects with `Error(message)`. Backend envelopes vary (`data`, raw array/object, `{ queue }`, or `{ queue, next_queue }`); inspect the actual endpoint shape instead of adding another unconditional `.data` unwrap. Existing dashboards use both service wrappers and direct shared-client calls.

Use `AuthContext`/`useAuth` for sessions, `useDashboardIdentity` for profile labels, shared constants for roles/states/services, and common components for controls. Tailwind 4 is loaded through `@tailwindcss/vite` and `@import 'tailwindcss'`; there is no `tailwind.config.js` in this checkout. `App.jsx` loads Poppins only for selected routes; the landing/admin views use their own font stacks and doctor Home limits that font load to desktop. Preserve lazy routes/charts/manual, responsive WebP assets, and the cinematic hero's motion/loading behavior. `pages/LandingPage.jsx` was removed; `components/pages/cinematic-landing-page.jsx` is the active landing page.

### Backend

Models are plain async objects using the mysql2 pool; controllers validate requests, invoke models/workflows, and return HTTP responses. Parameterize SQL values and allowlist dynamic identifiers. Multi-row workflows use a single acquired connection with commit/rollback/release; preserve category-before-ticket locking for queue mutations and sequence allocation. Keep SMS submission outside clinic transaction locks.

`server.js` mounts Helmet, configured CORS, 10kb JSON/urlencoded parsers, development bypass when enabled, `/api` request auditing, route groups, health, 404, and the global error handler. The auth prefix has a 100-request/15-minute IP limiter that skips GET/HEAD/OPTIONS so profile polling does not consume login attempts. Recovery adds narrower limits. Protected routers apply `authenticate` and `authorize` explicitly; route order matters for fixed paths before `/:id`.

### Adding or Changing a Feature

1. Inspect existing callers, actual route permissions, response shapes, schema, and focused tests.
2. Add/change the model or shared workflow with validation, ownership checks, and transactions where needed.
3. Add the controller and route, placing fixed paths before parameter routes; mount a new prefix in `server.js` only when needed.
4. Update the frontend shared-client/service call, constants, UI state/errors, and affected role views.
5. Supply any required schema change explicitly; the incremental migration SQL does not bootstrap the base database.
6. Run relevant backend/Node/browser checks and frontend lint/build for changed code. Document failures and verification limits rather than claiming mocked tests prove deployment behavior.
7. Update this guide and the related SMS/grace/recovery/leave/audit/synchronization documentation when behavior or setup changes. Some supporting guides retain older contracts; verify against the current source before reusing an example.

## Demo Cleanup

With `DB_NAME=ekalusugan_demo` and a loopback `DB_HOST`, run `node reset-test-data.js ekalusugan_demo` from `server/`. The command refuses production mode and requires the exact demo database name as confirmation. It deletes **all of today's queues** and their consultations, prescriptions, vital signs, medical records, and queue-alert SMS jobs. It also deletes today's appointments with reason `Same-day queue registration` and resets today's non-lock sequence counters. It retains the category `serving` lock rows.

This is for an explicitly intended demo database only. Stop the backend first so consultations, queue actions, and SMS cannot race the reset. The utility runs the cleanup in a transaction and rolls back on failure; rollback does not make a successful reset nondestructive. It does not reset every table, saved doctor report, or all SMS/account data.

Doctor absence reasons: run `npm run migrate:doctor-unavailable-reason` in `server` before deploying. Daily settings require a reason when marking unavailable; capacity-only updates preserve it and returning to available clears it. Leave requests require a reason. Both forms offer preset reasons and require details for Others.
