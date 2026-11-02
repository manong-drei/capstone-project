# Patient account recovery

## Self-service SMS recovery

Apply `npm run migrate:password-recovery` from `server/` after the SMS and audit migrations, then restart the backend. The migration is additive and can be rerun. It creates `password_recoveries`, adds the `password_recovery` SMS purpose and a nullable `sms_jobs.recovery_id`, and preserves existing passwords and history. No new dependency or SMS provider is needed. SMS must be enabled with the existing provider/encryption configuration.

Patients select **Forgot password?** on login, enter their registered login mobile number, enter the four-digit SMS code (including any leading zero), and choose a new password. Only active patient accounts linked to an unarchived patient record qualify. Malformed, unknown, inactive and other-role numbers display `invalid phone number`. This intentionally discloses whether a number is eligible, as requested.

- Codes expire five minutes after issuance, including queue/delivery time. A resend is allowed after 60 seconds and cancels previous codes and reset grants. Limits persist in the database: three issued codes per number in any 15-minute window. Failed delivery still counts toward the limit.
- Three wrong four-digit guesses close a challenge. Each API instance additionally limits requests per IP over 15 minutes: 10 sends, 20 verifications, 10 reset submissions. The existing global auth limiter remains in force. Restarting an API instance resets its IP counters; per-number counts and attempt counts remain in the database.
- A correct code is consumed once and grants five minutes to save a new password. The reset token lives only in the dialog's memory, grants no normal API access, and can be used only once. Closing or refreshing the dialog clears it. Password rules match the existing password-change flow, including rejection of the current password.
- Requesting/verifying a code leaves the old password and sessions usable. Saving the new password atomically changes its hash, increments the credential version (invalidating all prior sessions), clears temporary credentials/lockout, cancels stale credential SMS jobs and records completion. The patient returns to login; no automatic login is created.
- Codes are keyed hashes in recovery rows and encrypted in queued SMS payloads. Reset tokens are hashed. Credentials are excluded from audits, provider history responses and application logs. Existing SMS retry/uncertain-submission behavior is reused; an already submitted old message may arrive, but its code cannot be used after replacement or completion.

Public endpoints, all returning `Cache-Control: no-store`:

1. `POST /api/auth/password-recovery/request` with `{ phone }` returns `{ success, recovery_id, expires_in: 300, resend_after: 60 }`.
2. `POST /api/auth/password-recovery/verify` with `{ recovery_id, otp }` returns `{ success, reset_token, expires_in: 300 }`.
3. `POST /api/auth/password-recovery/reset` with `{ recovery_id, reset_token, newPassword }` returns a success message directing the patient to login.

Limits return 429, bad inputs/invalid or expired credentials return 400, and unavailable SMS/database/audit services return a generic 503 without credentials. Password/account updates invalidate outstanding grants through credential-version, phone, active-state and patient-link checks. The SMS worker checks eligibility before submitting each code and reconciles expired, cancelled and failed recoveries every five seconds while enabled.

The existing admin **Audit Logs** tab includes recovery requested, phone verified, completed/password changed, failed, expired and cancelled events. Each records a shared recovery ID, patient ID/name, masked number, controlled status/reason and timestamp. Requests/incorrect codes are attributed to an unauthenticated visitor; only successful phone verification identifies the patient actor. Administrators never see OTPs, reset tokens or passwords. State changes and audit records commit together. Reuse the Action filter to distinguish requests from successful completion; match the recovery ID in details to follow one attempt.

## Staff-assisted fallback

The in-person flow remains available for patients who cannot receive SMS or access their registered number. Receptionists use the existing `staff` role; admins have the same recovery access.

## Clinic workflow

1. Patients who cannot complete SMS recovery visit clinic reception.
2. Staff select **Account recovery** on their dashboard and search by name or mobile number digits. Admins select the recovery link in patient management.
3. Open the patient profile. Ask the patient to provide their first name, last name, registered login number, address (barangay and city), and birthday. Confirm all five match and that the patient is physically present. The profile's contact number can differ from the login phone; recovery uses the explicitly labeled registered login number.
4. Stop if anything differs or identity remains uncertain. Personal details can be known by others; these confirmations record the receptionist's judgment, not automated proof of identity. Missing identity details, archived/unlinked records, and inactive accounts must be resolved separately by an admin.
5. Confirm issuance. This immediately replaces the old password and invalidates all existing sessions, including any password-setup session. A stale profile is rejected; refresh and verify again.
6. Hand the temporary password directly to the verified patient. It appears once, remains only in browser component memory, and disappears when closed, expired, or left. Refreshing cannot retrieve it. If the issuance response is lost, refresh the profile, verify identity again, and issue a replacement.
7. The patient logs in with their unchanged registered phone number and the temporary password within 30 minutes. Login consumes the password once and grants 15 minutes to choose a new password before accessing the dashboard. A lost or expired setup session requires another verified issuance.

## API contract

`GET /api/patients/:id` is restricted to staff/admin and returns the existing patient/visit data with `account: null` for an unlinked or non-patient account, or `account: { phone, is_active, credential_version }`. No password hash or temporary password is included.

`POST /api/patients/:id/account-recovery` requires a valid `purpose: "session"` staff/admin JWT. Development header bypasses and development-purpose tokens are denied. Send the credential version obtained from the profile:

```json
{
  "expected_credential_version": 2,
  "verification": {
    "patient_present": true,
    "first_name": true,
    "last_name": true,
    "phone": true,
    "address": true,
    "date_of_birth": true
  }
}
```

All six flags must be the boolean `true`; patient ID and credential version must be positive safe integers. The server generates the password and uses the stored login phone. Submitted phone numbers or chosen passwords do not alter either value.

- `201`: `{ success: true, data: { temp_password, expires_at, registered_phone } }`. `expires_at` is an ISO timestamp; the UI displays Philippine time. The response has `Cache-Control: no-store`.
- `400`: invalid ID/version or incomplete verification confirmations.
- `401/403`: missing/invalid session, unauthorized role, or development identity.
- `404`: patient record missing.
- `409`: record/account ineligible, identity record incomplete, or stale credential version.
- `429`: more than 10 requests per authenticated staff account in 15 minutes, per API instance. This limiter counts unsuccessful requests too.
- `500`: issuance failed. Refresh the profile before another attempt because a lost response can follow a successful commit.

## Credential and audit handling

One transaction locks the patient and account, checks version and eligibility, generates a secure six-digit string, stores its bcrypt hash, sets `must_change_password`, and records a database-time expiry 30 minutes ahead. It increments the credential version and clears login failures, lockout, and previous temporary-password redemption. Queued/submitting `temporary_password` SMS jobs are cancelled and their payloads cleared; unrelated queue notifications are preserved. An SMS already submitted may still arrive, but its superseded credential/version cannot authenticate.

The same transaction writes `patient_audit.action = 'account_recovery'` with actor/patient IDs and details containing the account ID, confirmed checklist, new credential version, and expiry. The audit contains no password or duplicated identity details. Any failure before commit rolls back the credential, SMS cancellation, and audit together. Passwords appear only in the successful authorized issuance response; keep that response out of application/proxy logs and use HTTPS in deployment.

The existing account login lockout and IP limiter, one-use redemption, setup-only JWT access, and permanent-password validation remain in force. Account creation and admin SMS replacement retain their current behavior and 72-hour SMS expiry.

## Verification

Run `npm test` from `server`, and `npm run test:e2e -- tests/account-recovery.spec.js`, `npm run lint`, and `npm run build` from `capstone-app`. Recovery tests mock database/SMS interactions and browser API responses, use synthetic accounts, and send no paid SMS or updates to real accounts. They cover route authorization/rate limiting, transaction rollback, racing issuance, expiry, redemption, session invalidation, password setup, UI verification gating, error handling, and clearing the displayed password.

Self-service coverage: `node --test test/passwordRecovery.test.js` and `npm run test:e2e -- tests/patient-password-recovery.spec.js tests/account-recovery.spec.js tests/admin-audit-logs.spec.js`. Set `RECOVERY_DB_TESTS=true` for additional real-MySQL coverage using dedicated connection-local temporary tables; it never updates real accounts or sends SMS.
