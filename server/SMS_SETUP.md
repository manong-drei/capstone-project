# Semaphore notifications

The implementation uses regular outbound messages (one recipient per request), an approved alphanumeric sender name, and a MySQL outbox. It adds no dependencies.

## Deployment

1. Back up the existing database. The application's previous schema migrations must already be applied. Do not recreate deleted historical migration files or rerun unrelated migrations.
2. Stop the API and run `npm run migrate:sms` from `server`. MySQL schema changes are not transactional: if it fails midway, inspect the schema before retrying. The runner refuses a second application.
3. Add the entries from `.env.sms.example` to the server environment. Generate `SMS_ENCRYPTION_KEY` once with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`; store it securely and retain it while jobs are pending. Configure the real Semaphore API key and approved sender name. An encryption key is required to create patient accounts even while delivery is disabled.
4. Use HTTPS for the hosted frontend and API. Disable the existing development authentication bypass in production (`NODE_ENV=production`). Configure MySQL's session/server time zone for Asia/Manila and retain the existing connection `+08:00` date conversion.
5. Set `SMS_ENABLED=true` and restart. The worker initializes today's existing waiting tickets by their current projected position. Tickets within the threshold are suppressed; those farther back are armed. Older tickets are never sent alerts.
6. Check the admin Notifications tab, set the threshold, and perform a controlled real SMS test using your own confirmed mobile number. Confirm the sender cannot receive replies and the clinic has sufficient credits.

All existing JWT sessions must log in again because the new middleware requires credential versions. Permanent password hashes are preserved. Existing temporary passwords with unknown issuance times expire during migration; admins must verify the patient's identity and issue a replacement. A redeemed password cannot be reused; losing/expiring the 15-minute setup session requires admin replacement.

## Behavior

- New patient account and encrypted password SMS are committed together. No plaintext password is returned to the admin. Passwords are cryptographically random six-digit strings, including leading zeros. Five wrong attempts lock that account for 15 minutes in addition to the existing IP limiter.
- The 72-hour lifetime begins at first delivery submission, including a rejected submission; retry attempts do not reset it. Login atomically consumes the temporary credential and grants only password setup and `/auth/me` access. Successful setup invalidates the old session and returns a normal JWT.
- Queue positions and clinic displays use the same source alternation and priority selection as call-next. Position 1 is next. The initial suppression decision is permanent, even if the admin later changes the threshold or the queue order changes.
- Queue alerts use the registered account phone or the walk-in contact confirmed by staff. Walk-in contacts must still match the associated patient record. Invalid, changed, archived or inactive associations are skipped. Alerts contain no name, diagnosis or service details.
- Queue confirmation tells suppressed patients to stay nearby. Staff must relay the notice shown after walk-in registration. This policy does not prove a patient is physically present; remote patients near the front receive no alert.

## Delivery and recovery

The worker wakes after queue/account/settings changes and checks every five seconds. A distributed MySQL advisory lock serializes worker instances; durable database timestamps throttle submissions and status polling separately. Account/category locks protect the eligibility check and are released before the bounded 10-second network request, so clinic actions do not wait for Semaphore. Once submission begins, a queue alert cannot be recalled if the patient's status changes. A credential replaced during submission stays invalid, even if its old SMS subsequently arrives.

Claims are committed before the network request. Submissions interrupted for more than 60 seconds become `unknown`, clear their payload, and are never automatically resent. Certain connection failures and HTTP 429 rejections retry at most three times, honoring `Retry-After`; ambiguous timeouts, malformed success responses and HTTP 5xx responses become `unknown`. Other rejections become `failed`. Provider delivery failures do not automatically create a second paid SMS. Polling failures only retry the status lookup, never the submission.

Review `unknown` entries in the admin Notifications tab against Semaphore's message history before issuing a replacement password. Queue alerts cannot be manually resent in this version. Admin patient management exposes the latest activation delivery status and an identity-confirmed, audited replacement action. Messages accepted earlier may still arrive after replacement, but their old credential cannot log in.

Pending bodies are AES-GCM encrypted; bodies are deleted on submission, failure, cancellation or uncertainty. Logs contain only job IDs, statuses and fixed error codes. UI history masks recipient numbers. Restrict database access because recipient snapshots remain stored. SMS transport is not end-to-end encrypted; phones and Semaphore can retain delivered messages. `sent` means delivered to the network, not read by the patient.

## Interfaces

- `GET /api/admin/sms-settings` → `{ success, data: { threshold, updated_at } }`.
- `PUT /api/admin/sms-settings` accepts `{ threshold }`, integer 1–100; applies to both services.
- `GET /api/admin/sms-jobs` returns the latest 100 jobs with masked recipients and no bodies or keys.
- `POST /api/admin/patients/:user_id/temporary-password` accepts `{ identity_confirmed: true }`; only active patient accounts awaiting activation qualify. Returns queued job status, never a password.
- Account creation returns `sms_job_id` and `sms_status` instead of `temp_password`.
- `PATCH /api/auth/change-password` accepts `{ newPassword }` for setup sessions; normal sessions also require `oldPassword`. Returns a new `token` and `user`.
- Queue records include `sms_alert_state`, `sms_initial_position` and `sms_initial_threshold`; public queue status retains its existing fields.

Official API: https://semaphore.co/docs. POST `https://api.semaphore.co/api/v4/messages` uses form fields `apikey`, `number`, `message`, `sendername`. Status checks use GET `/api/v4/messages/{id}` with `apikey`. Messages remain within 160 ASCII characters. SMS fees and network delays are determined by Semaphore.

## Verification

Run `npm test` in `server` and `npm run build` in `capstone-app`. Tests mock Semaphore and database connections: they send no paid messages and change no live database. Real migration, MySQL locking, telco delivery and one-way sender behavior still require deployment verification.
