# Server code review

Reviewed: 2026-10-08 (Asia/Manila).

Scope: the current `server/` working tree, including every application, route, middleware, model, utility, configuration script, test, maintenance script, the Python analytics script, CSV artifacts, and package configuration. Frontend callers and installed Express/mysql2 code were checked where necessary to establish actual behavior.

**32 actionable findings:** 10 P1, 19 P2, and 3 P3. The most urgent problems are stale access after account deactivation, patient-controlled priority eligibility, broken staff edits, inconsistent clinical records, date corruption, and unsafe cleanup behavior.

- **P1:** fix before using the affected flow with real patient data or deploying it.
- **P2:** a reproducible correctness or reliability defect, sometimes requiring the scenario described.
- **P3:** a smaller API or development workflow defect.

This is a review report; application code was not changed. Existing deletions of four migration SQL files and `src/seedDemoData.js` were preserved. Findings describe the current working tree rather than attributing those deletions to a new change.

## Verification and limits

- `cd server; npm test`: **7/7 tests passed**. These tests use mocks and do not establish live database correctness.
- Two temporary, inline Node checks: **25/25 assertions/scenarios passed**, confirming the defective behavior described below. Database calls, SMS fetches, and identities were isolated; no live records were changed or messages sent.
- `node --check` passed for **all 40 JavaScript files**, including tests and the reset script.
- CSV structure checks passed: **84 history rows, 7 forecast rows, and 28 backtest rows**.
- No live database integration, migration execution, cleanup execution, external provider call, or dependency advisory audit was performed.
- Python source was reviewed, but its executable could not launch in this environment; ARIMA training was not rerun.
- Findings marked **isolated check** were exercised with mocked dependencies. Findings marked **traced** follow directly from inspected code and callers. Deployment/schema-dependent items are separated at the end.

Locations are relative to this report's `server/` directory. Line numbers refer to the reviewed source.

## P1 findings

### F01 — Deactivating an account does not revoke its access

**Locations:** `src/middleware/authenticate.js:15`; `src/controllers/adminController.js:261` and `:606`; `src/models/User.js:10`.

Login checks `is_active`, but protected requests only verify the JWT signature and expiration. After an admin deactivates a patient, staff member, doctor, or another admin, that user's previously issued token continues to authorize requests using its embedded role. This includes clinical mutations and administrative endpoints.

**Reproduce:** log in, retain the token, deactivate that account, and reuse the token on a protected endpoint. The authentication middleware never queries the account. **Evidence:** isolated check confirmed successful authentication with zero account lookups.

**Suggested fix:** load the current account in the shared authentication middleware and reject missing/inactive users. Use the current database role for authorization.

### F02 — Patients can grant themselves priority eligibility

**Locations:** `src/controllers/patientController.js:25`; `src/models/Patient.js:102–126`; `src/controllers/queueController.js:91`.

The patient-owned profile endpoint accepts both `priority_category` and `priority_expires_at`. Queue registration then trusts those values. A regular patient can submit `{"priority_category":"pwd","priority_expires_at":null}` to `PUT /api/patients/me` and become eligible for priority queues without staff approval. Any nonempty category also passes the queue eligibility check.

**Evidence:** isolated check confirmed these fields reach the profile UPDATE through the real controller and model.

**Suggested fix:** remove eligibility fields from patient-editable columns; keep changes in a validated staff/admin flow. Validate categories and expiration when granting eligibility.

### F03 — Staff edits containing a phone number always fail

**Locations:** `src/controllers/adminController.js:320`, `:373`, and `:388`.

`normalizedPhone` is declared inside `if (email || phone)` and used outside that block in both the doctor and staff branches. Including `phone` produces a `ReferenceError`, rolls back the transaction, and returns 500. The frontend edit modal always includes the existing phone, so changing only a name through that modal also fails.

The doctor branch has a second defect: it appends `contact_number` to the update arrays after executing the doctor UPDATE. Fixing only the variable scope would leave doctor contact details unchanged.

**Evidence:** isolated checks reproduced 500 plus rollback for both staff and doctor edits.

**Suggested fix:** normalize the phone in a scope shared by both branches and assemble all doctor fields before executing its UPDATE.

### F04 — Consultation saves can partially commit or create duplicates

**Locations:** `src/controllers/doctorController.js:281–337`.

The serving-state read, consultation insert, prescription insert, queue completion, and appointment completion are separate pool queries without a transaction or row lock. A prescription failure leaves a committed consultation while returning 500 and keeping the queue serving. Retrying can insert another consultation. Two concurrent submissions can also both observe `serving` and attempt the inserts before either marks the queue done.

**Evidence:** isolated checks reproduced an inserted consultation followed by prescription failure, and two concurrent requests both inserting and returning 201. A live unique constraint might reject the second insert, but it would not make the entire workflow atomic; the current schema was unavailable for verification.

**Suggested fix:** use one connection and transaction, lock the queue before checking its state, validate the complete payload before writing, and commit the clinical records and status changes together. Add a queue-level uniqueness constraint if there should be one consultation per queue.

### F05 — One queue can cancel or complete unrelated appointments

**Locations:** `src/controllers/queueController.js:116–119`, `:321–337`, and `:382–385`; `src/controllers/doctorController.js:331–335`; `src/models/Appointment.js:15–27` and equivalent subqueries in the other list methods.

Queue-to-appointment association is inferred from patient and date. Cancellation updates every pending/confirmed appointment for that patient on the queue's date; completion updates every such appointment today. Neither targets an appointment ID or doctor. A patient with two appointments can have both cancelled or completed after only one visit. Consultation completion also does this for walk-ins.

Registration can reuse an appointment belonging to a different doctor because its existing-appointment lookup omits doctor identity. Appointment history similarly borrows the first queue's services or latest cancellation reason for all appointments that day, including queues from another category.

**Evidence:** isolated check confirmed the completion UPDATE has neither an appointment ID nor doctor filter; the other paths were traced.

**Suggested fix:** record an explicit appointment reference on the queue and use it for status changes and history joins. A queue without an appointment should leave other appointments alone.

### F06 — Patient merging leaves clinical history attached to the archived patient

**Locations:** `src/controllers/patientController.js:135–138`; `src/controllers/doctorController.js:300–306`.

Merging moves `queues.patient_id` to the target but does not move `consultations.patient_id`, even though consultation records store that identifier independently. After a completed walk-in is merged, its queue points to the target while its consultation still points to the archived source. Patient-based clinical history can consequently omit that visit or disagree with queue history.

**Evidence:** isolated check confirmed the merge performs no consultation update.

**Suggested fix:** move consultation patient references in the same transaction and inspect all other patient-owned tables for equivalent references.

### F07 — Database connection failures escape two Express handlers

**Locations:** `src/controllers/queueController.js:83`; `src/controllers/patientController.js:116`; cleanup awaits in the same handlers and `src/controllers/queueController.js:263–267`.

`createQueue` and `mergePatient` await `pool.getConnection()` before entering their `try` blocks. A rejected connection acquisition therefore escapes the handlers. Installed Express 4 invokes handlers without catching rejected promises, so the global error handler does not receive that error; under normal Node unhandled-rejection behavior, it can terminate the process.

Rollback and named-lock release failures can similarly escape some handlers and prevent `connection.release()` from running.

**Evidence:** isolated checks confirmed both acquisition failures reject rather than return an HTTP error. Installed Express's `lib/router/layer.js` was inspected.

**Suggested fix:** acquire inside the protected `try`, guard rollback/release, and forward unexpected async errors to Express. Ensure connection release still executes when cleanup fails.

### F08 — SQL DATE values are serialized as the previous calendar day

**Locations:** `src/config/db.js:20`; raw date returns in `src/models/Patient.js` and `src/models/Appointment.js`; `src/controllers/queueController.js:216`.

mysql2 returns DATE values as JavaScript Dates by default. With `timezone: '+08:00'`, `1990-01-01` becomes midnight Manila time, whose JSON representation starts with `1989-12-31`. Current frontend consumers take the first ten characters: the walk-in form populates an existing patient's birthday this way, and doctor appointment history uses the same operation for its date filter. Reusing and submitting a patient can save the shifted birthday back into the database.

The walk-in audit comparison also calls `toISOString().slice(0, 10)` on stored Dates, falsely treating an unchanged local birthday as a change.

**Evidence:** isolated check exercised the installed mysql2 DATE parser and confirmed `1990-01-01` serializes to a string beginning `1989-12-31`.

**Suggested fix:** preserve date-only columns as strings, for example with mysql2's `dateStrings: ['DATE']`, and keep birth/appointment/report dates as `YYYY-MM-DD` throughout their callers.

### F09 — The test cleanup script deletes real current-day clinical data

**Locations:** `reset-test-data.js:15–17`, `:34–51`, and `:55–57`.

The script is described as deleting test/demo data, but it selects every queue today and deletes their prescriptions and consultations, followed by every queue today. There is no demo marker or environment/database restriction. If run against a database containing actual visits, it deletes those clinical records as well. Only the appointment delete filters for the same-day registration reason.

The deletes also lack a transaction. A later failure can leave prescriptions deleted while consultations or queues remain. The final queue delete uses a fresh date predicate rather than the captured queue IDs, so newly registered queues can enter its deletion set during the reset.

**Evidence:** isolated VM execution against a fake pool confirmed the unrestricted current-day DELETE. The real reset script was not run against MySQL.

**Suggested fix:** restrict the operation to an explicitly disposable demo database or positively identified demo records. Delete the captured records in one transaction and require the intended destructive scope to be explicit.

### F10 — All configured migration commands reference missing files

**Locations:** `src/config/migrateQueueSequences.js:8–11`; `src/config/migrateQueueStatusReason.js:8–11`; `src/config/migrateWalkInPatients.js:9`; `src/config/migrateDoctorDailyReports.js:5`; `package.json:12–15`.

The current working tree has deleted all four SQL files that these runners read. Every advertised migration command fails with ENOENT. A fresh or outdated database cannot acquire the schema that queue registration, status reasons, patient auditing, and daily reports require through these commands.

**Evidence:** isolated filesystem assertions confirmed all four expected paths are absent. These deletions existed before this review.

**Suggested fix:** restore the referenced migrations or replace the runners and package scripts with the intended supported schema setup. Existing databases that already have the schema may continue working; this finding concerns provisioning/upgrades.

## P2 findings

### F11 — Mandatory password change is enforced only by the frontend

**Locations:** `src/controllers/authController.js:147–163`; `src/middleware/authenticate.js:15`; `src/models/User.js:25–29`.

Patient creation sets `must_change_password = 1`, but login issues an unrestricted token and authentication never checks the flag. The frontend redirect can be bypassed by calling the API directly, allowing normal protected operations with the temporary credential. `/auth/me` also omits the flag from its selected columns.

**Reproduce:** use a newly created patient's temporary password, then use the returned token for queue/profile operations before changing it. **Evidence:** traced; the shared authentication check exercised for F01 has no account/flag lookup.

**Suggested fix:** enforce the flag in shared authentication, permitting only the identity and password-change operations needed to finish setup, and return the flag consistently.

### F12 — Queue status updates allow invalid transitions and multiple serving patients

**Locations:** `src/controllers/queueController.js:300–311`, `:358–379`; `src/models/Queue.js:229–235`.

The status endpoint validates the destination status but not the existing status or date. Staff/doctor requests can revive a completed/cancelled queue or mark several queues `serving`, bypassing the single-serving check in `callNext`. Patient cancellation checks ownership but permits cancellation of a completed queue, including historical entries, which rewrites visit history and its cancellation reason.

**Evidence:** isolated check confirmed a patient can successfully cancel a `done` queue; the arbitrary staff transition path was traced.

**Suggested fix:** validate allowed state transitions while locking the row. Make entering `serving` use the same concurrency rule as call-next, and restrict patient cancellation to cancellable active entries.

### F13 — A no-show remains the patient's active queue

**Locations:** `src/models/Queue.js:68`; `src/controllers/queueController.js:94`; `src/controllers/queueController.js:239–242`.

`findByPatientId` excludes only `done` and `cancelled`, so `no_show` is returned by `/queue/me` and prevents self-registration with the already-active error. Staff walk-in registration uses the narrower `waiting`/`serving` definition, so the same record is treated inconsistently across flows.

**Evidence:** isolated check confirmed `no_show` is returned by the real model query path.

**Suggested fix:** use one explicit active-status definition, normally `waiting` and `serving`, for lookup and duplicate checks.

### F14 — Appointment status changes leave an associated queue active

**Locations:** `src/controllers/appointmentController.js:133–164`; `src/models/Appointment.js:154–164`.

The appointment status endpoint updates only the appointment. Cancelling a same-day appointment leaves its associated queue waiting/serving and eligible for call-next; marking the appointment completed similarly leaves its queue active. Queue-to-appointment updates exist in the opposite direction, so callers get inconsistent results depending on which endpoint they use.

**Reproduce:** create a same-day appointment/queue, cancel its appointment through the staff endpoint, then inspect/call the queue. **Evidence:** traced.

**Suggested fix:** after establishing the explicit association described in F05, apply the intended corresponding transition atomically in both directions.

### F15 — Queue and appointment status changes can partially commit

**Locations:** `src/controllers/queueController.js:311–337` and `:379–385`; `src/models/Queue.js:229–235`.

These paths commit the queue UPDATE before attempting the appointment UPDATE. If the second query fails, the endpoint returns 500 while the queue has already changed. Retrying or refreshing then sees a terminal queue with a pending appointment. This defect remains even after narrowing the appointment selection in F05.

**Evidence:** isolated check injected an appointment update failure and confirmed that the queue was already changed when HTTP 500 was returned.

**Suggested fix:** pass one transactional connection through the queue update/fetch and linked appointment update.

### F16 — Reactivating cancelled appointments bypasses capacity and availability

**Locations:** `src/controllers/appointmentController.js:135–164`; compare the booking checks at `:91–108`.

Any existing appointment can be changed from `cancelled` to `pending` or `confirmed` without checking daily settings or capacity. Fill a doctor's day, then reactivate another cancelled appointment: the count exceeds the limit enforced by booking. A cancelled appointment can likewise be restored for a day when the doctor is unavailable.

**Evidence:** isolated check confirmed successful reactivation without any capacity/settings database lookup.

**Suggested fix:** validate transitions and reuse booking's doctor-row lock, availability, and capacity checks when reopening a cancelled appointment.

### F17 — The advertised next queue differs from the queue actually called

**Locations:** `src/models/Queue.js:158–202` and `:238–267`; `src/models/Queue.js:47–50`.

`callNext` alternates registered and walk-in patients before sorting by priority within that source. Public status and dashboard ordering sort all waiting patients by priority and arrival time, ignoring alternation. After a registered patient was served, a waiting registered priority patient can appear next while call-next selects a regular walk-in instead.

**Evidence:** isolated check reproduced public `next_queuing = P-001` followed by call-next selecting `Q-002`.

**Suggested fix:** make previews use the same source preference and ordering as the actual selection.

### F18 — Deactivated doctors are still offered and accepted for booking

**Locations:** `src/models/Doctor.js:10–19`; `src/controllers/appointmentController.js:86–88`; `src/controllers/queueController.js:105` and `:189`.

Doctor listings and booking/queue selection query the `doctors` table without checking its user's `is_active`. Deactivating a doctor leaves the profile row intact, so patients can still see and book that doctor, and the first-doctor queue rule can keep assigning that account new visits.

**Reproduce:** deactivate a doctor, then request `/api/doctor` and book their doctor ID. **Evidence:** traced through deactivation, listing, and booking queries.

**Suggested fix:** join the user record and require an active doctor account wherever a doctor is offered or selected.

### F19 — Opposite registration lock order can deadlock

**Locations:** `src/controllers/queueController.js:86–105` and `:188–211`.

Self-registration locks the patient before the first doctor. Dental walk-in registration locks the first doctor before the selected patient. Concurrent registrations for the same patient can each hold the row the other needs: the self request waits for the doctor while the staff request waits for the patient. MySQL must abort one transaction; the handler returns a generic 500 instead of a controlled conflict/retry.

**Evidence:** traced lock cycle; not exercised against a live database. The walk-in advisory lock does not serialize the self-registration path.

**Suggested fix:** acquire common row locks in the same order in both workflows. Handle/retry a bounded deadlock failure where appropriate.

### F20 — Daily settings default to yesterday before 08:00 in Manila

**Location:** `src/controllers/doctorController.js:142`.

The default date uses `toISOString()`, which is UTC. At 00:30 on October 8 in Manila it selects October 7, while queue queries use the database's current date. Settings/counts therefore refer to the previous day when the caller omits `date`. Current doctor frontend callers also explicitly construct a UTC date, so changing only this default will not fix those callers.

**Evidence:** isolated fixed-clock check confirmed the selected date is `2026-10-07` at `2026-10-08 00:30 +08:00`.

**Suggested fix:** derive the clinic date in Asia/Manila consistently in the API and its callers.

### F21 — Dental walk-in counts include general-clinic patients

**Locations:** `src/controllers/doctorController.js:160–163`; compare `src/controllers/queueController.js:200–202`.

Daily settings counts every walk-in queue, including `category = 'general'`, while dental registration enforces its limit using only dental walk-ins. General-clinic traffic can make the dental dashboard show full capacity even when dental registration still accepts patients.

**Evidence:** isolated check confirmed the settings count has no category restriction; the registration count does.

**Suggested fix:** apply the same category filter to the displayed and enforced counts. If capacities become per-doctor, both counts also need an explicit doctor association.

### F22 — Daily settings accept invalid limits and availability types

**Locations:** `src/controllers/doctorController.js:182–224`.

Checks only compare limits numerically and reject `undefined`, so `null`, fractional values, and nonnumeric strings can reach the SQL query. Truthiness converts string `"0"` or `"false"` to available rather than unavailable. Invalid dates also reach SQL without the strict validation already used by daily reports. Depending on the schema, invalid values are coerced, rejected as 500, or read back using fallback limits.

**Evidence:** isolated check accepted null limits and string `"0"`, generating parameters `[doctor_id, date, null, null, 1]` with HTTP 200 under the mocked writer.

**Suggested fix:** require whole-number limits within bounds, validate the calendar date, and accept only documented boolean/0/1 availability values.

### F23 — Appointment date validation accepts impossible dates; time is unvalidated

**Locations:** `src/controllers/appointmentController.js:59–74` and `:111–118`.

`new Date('2027-02-30')` rolls forward into March, so the date regex plus `isNaN` check accepts February 30 and passes the original invalid string to SQL. `appointment_time` is checked only for truthiness, allowing malformed strings and non-time values to reach the model. Actual MySQL behavior then determines whether the request fails as 500 or stores an unintended value.

**Evidence:** isolated check passed both `2027-02-30` and `not-a-time` through to `Appointment.create`. The mocked insert's 201 demonstrates missing validation, not that MySQL would accept those values.

**Suggested fix:** validate the actual calendar date with a round-trip check or the installed date-fns functions, and validate a supported clock-time format/range before acquiring a connection.

### F24 — Patient birth dates can be future or otherwise invalid

**Locations:** `src/controllers/adminController.js:454–460` and `:488–494`; `src/controllers/patientController.js:25–49`; `src/models/Patient.js:106–107`.

Admin creation checks that a birth date exists, but not its validity or whether it is in the future. Patient profile updates permit birth-date changes without either check. A valid future date is accepted by a DATE column and leads to negative ages in analytics; malformed dates become database-dependent failures. Walk-in registration already performs stricter checks, so behavior differs by entry point.

**Reproduce:** create/update a patient with a future birthday such as `2099-01-01`. **Evidence:** traced validation and write paths.

**Suggested fix:** apply the existing walk-in date validation consistently to patient creation and profile updates; validate the other editable demographic types/enums at the same boundary.

### F25 — Walk-in pregnancy priority never establishes or refreshes its expiry

**Locations:** `src/controllers/queueController.js:215–236`; compare `src/controllers/adminController.js:513–517` and `src/controllers/queueController.js:91`.

Admin-created pregnancy priority gets an expiration, but walk-in creation/update writes only `priority_category`. New pregnant walk-ins receive indefinite eligibility. A returning patient whose old pregnancy priority expired can receive a new priority walk-in queue while retaining the old expiration, causing subsequent self-queuing to reject their eligibility. Changing a patient from pregnant to a permanent category can likewise retain an inappropriate pregnancy expiry.

**Evidence:** isolated check accepted an expired pregnant patient's priority walk-in and confirmed no query updated `priority_expires_at`.

**Suggested fix:** update category and expiration together using the same policy in both staff/admin workflows, clearing stale expirations for permanent categories.

### F26 — Cleanup does not reset the queue counters it claims to reset

**Locations:** `reset-test-data.js:50–64`; `src/models/Queue.js:113–124`.

Queue numbers now come from `queue_sequences`, but cleanup only deletes queues/appointments. After cleanup the next number continues from the stored counter, despite the success message promising Q-001/G-001/P-001. The early no-queue return also leaves same-day registration appointments untouched if they remain from an earlier partial cleanup.

**Evidence:** isolated reset execution confirmed no access to `queue_sequences`; actual number allocation was traced.

**Suggested fix:** within the explicitly disposable reset scope established by F09, reset that day's relevant counters and handle orphan demo appointments even when there are no queues.

### F27 — Database connectivity checks report success on connection failure

**Locations:** `src/config/testConnection.js:44–50`; its required-table lists at `:24–34`.

The connection-error catch prints an error but never sets a nonzero exit code. Its finally block calls `process.exit()`, producing status 0 on a failed connection, so scripts can treat `npm run test:db` as successful while MySQL is offline.

The required-table check also omits `patient_audit`, `consultations`, and `prescriptions`, although patient profile/search and consultation operations depend on them.

**Evidence:** isolated VM check injected a connection failure and captured exit status 0.

**Suggested fix:** set `process.exitCode = 1` on failures, close the pool normally, and include the actual required application tables in the schema check.

### F28 — SMS delivery holds a database connection and the response open

**Locations:** `src/controllers/adminController.js:551–581`; `src/utils/sms.js:19–24`.

Patient creation commits the account, then awaits an external SMS request before releasing its connection or sending 201. Fetch has no application timeout. A slow or stalled provider can leave the committed account's request pending and consume a pool slot. Multiple pending registrations can exhaust the ten-connection pool; retries may encounter an already-created account without ever receiving the first request's temporary-password response.

**Evidence:** isolated check held the fake SMS fetch unresolved and confirmed both the response and connection release remained pending after commit.

**Suggested fix:** release the committed database connection before SMS delivery and add a bounded fetch timeout. Preserve a clear account-created response when delivery fails.

### F29 — Header-based development authentication has the wrong user shape

**Locations:** `src/middleware/devBypass.js:20–45` and `:75`; compare `src/routes/devAuthRoutes.js:69` and controllers reading `req.user.user_id`.

Header bypass injects `{id, role, ...}`, but personalized controllers use `req.user.user_id`. Authentication/authorization passes while patient, doctor, password, and audit operations receive an undefined identity. JWT-based development login correctly supplies `user_id`, so the advertised two development methods behave differently.

**Evidence:** isolated check confirmed the patient bypass user has `id = 1` and `user_id = undefined`.

**Suggested fix:** use the normal authenticated user field names in the bypass and map development identities to valid records for their roles.

## P3 findings

### F30 — Doctor creation silently discards specialization

**Locations:** `src/controllers/adminController.js:100` and `:177–180`; `src/models/Doctor.js:41–45`.

The controller accepts `specialization_id` but inserts a literal NULL. A caller receives successful creation while the doctor's requested specialization is absent. The existing doctor model demonstrates that the field is supported by the data layer.

**Evidence:** isolated check created a doctor with specialization 7 and confirmed the INSERT instead used NULL.

**Suggested fix:** validate and bind the supplied specialization, or remove that accepted field if specialization is deliberately unsupported.

### F31 — Login handles accepted phone formats inconsistently and lacks type validation

**Locations:** `src/controllers/authController.js:125–137`; `src/models/User.js:9–14`; `src/utils/phone.js:1–13`.

Account creation normalizes `+63`/`63` mobile formats, but login passes the raw phone directly to the database. The same valid number supplied during creation in international format therefore fails login unless manually changed to the stored `09...` form. Missing/non-string passwords can reach bcrypt and result in a server error rather than a client validation error. Password-change input likewise relies on `.length` without first requiring strings.

**Reproduce:** create an account using `+639123456789`, then submit that number with its password to login; lookup uses the unnormalized value. **Evidence:** traced normalization, lookup, and bcrypt call paths.

**Suggested fix:** normalize and validate phone input before lookup, and require nonempty string password fields before bcrypt operations.

### F32 — Malformed or oversized request bodies are reported as server failures

**Locations:** `src/server.js:37–38` and `:82–85`.

Express body parsers generate 400 for malformed JSON and 413 for payloads over 10kb, but the global handler discards `err.status` and always returns 500. Clients receive the wrong error class for recoverable input problems, and monitoring records them as server failures.

**Reproduce:** send invalid JSON or a body larger than 10kb to an API endpoint. **Evidence:** traced parser configuration and final error handler.

**Suggested fix:** preserve known parser/client error statuses while keeping unexpected errors generic and avoiding internal-detail exposure.

## Additional conditional issues and minor tooling notes

These are worth checking, but are not counted as established live defects because the required schema, deployment settings, product policy, or Python execution was unavailable.

### C01 — Native JSON services can be discarded by the queue parser

**Location:** `src/models/Queue.js:6–12`.

`_parse` always calls `JSON.parse` when services is truthy. Installed mysql2 already parses native JSON columns into JavaScript arrays by default. If `queues.services` is JSON, an array such as `['CONSULTATION']` throws during this second parse and is replaced by `[]`. If the column is TEXT, the current behavior works. The current SQL schema is unavailable, so this requires checking the column type. Handling arrays directly would cover both representations.

### C02 — The mysql2 timezone option does not establish MySQL's session timezone

**Location:** `src/config/db.js:20`; queries using `CURDATE()`, `CURTIME()`, and `NOW()` throughout the models/controllers.

The driver timezone controls date conversion; the pool does not issue `SET time_zone`. A MySQL server/session configured for UTC will consequently perform daily boundaries in UTC while JavaScript interprets returned dates with +08:00. This can affect queue-day limits, counters, booking dates, and reports before 08:00 Manila time. Check `@@session.time_zone`, `NOW()`, and `UTC_TIMESTAMP()` on a disposable/read-only connection and configure clinic-time sessions consistently. This concern is separate from the confirmed UTC default in F20.

### C03 — Multiple-doctor behavior requires an explicit policy

**Locations:** `src/controllers/queueController.js:105` and `:189`; `src/controllers/doctorController.js:19–52`.

Registration always uses the lowest doctor ID, while clinic analytics aggregates appointments across every doctor. If several doctors are intended to share bookings, an unavailable/full first doctor blocks registration despite another doctor's capacity, and appointment totals may mix specialties with dental-only queue statistics. If the application intentionally has a single shared dentist, this limitation may be acceptable. Appointment ownership errors described in F05 and inactive-doctor selection in F18 still apply independently.

### C04 — Python input validation can silently alter years or accept non-finite totals

**Location:** `src/analytics/arima.py:39–47`.

`reporting_year.astype(int)` truncates fractional numeric years instead of rejecting them. Recipient validation rejects missing/negative values but does not reject positive infinity or fractional counts, even though later output converts some actual values to integers. The supplied CSV has no demonstrated instance of these problems. Validate finite whole-number years/counts if external/replacement datasets are accepted; this path was not executed during the review.

### N01 — The ARIMA run instruction names a nonexistent script

**Location:** `src/analytics/arima.py:4`.

The docstring says to run `python train_bohc_arima.py`, but the file is named `arima.py`. From `server/`, the existing entry point is `python src/analytics/arima.py`. The synthetic-history caveats are already clearly stated; they were not counted as a hidden modeling bug.

## Interpretation checks that avoided false positives

- Admin `totalPatients` counts queue visits, and its current UI label is **Total Patient Visits**. It was not reported as an incorrect unique-patient count.
- The duplicate `conn.release()` on invalid staff phone input is undesirable, but the installed mysql2 connection guards repeated releases. It was not reported as established pool corruption.
- The legacy `utils/generateQueueNumber.js` has count-based/UTC weaknesses, but has no current callers. Current registration uses `Queue.nextQueueNumber`; the unused helper was not treated as a live numbering failure.
- Development bypass being enabled specifically in development is intentional. F29 concerns its inconsistent identity shape, not the existence of the authorized development feature.

## Suggested repair order

1. Restrict account access and priority ownership: F01, F02, F11.
2. Protect clinical record identity/atomicity: F04–F08, F12–F16.
3. Repair common user workflows and provisioning: F03, F10, F18–F25, F29.
4. Make maintenance and external calls reliable: F09, F26–F28.
5. Resolve the smaller API defects and verify the conditional items against the actual schema/deployment.

After repairs, add focused regression checks for inactive tokens, patient priority editing, phone-bearing staff edits, failed/duplicate consultations, merge history, date-only round trips, status transitions, and cleanup scope. Existing happy-path mocks do not cover those failures.
