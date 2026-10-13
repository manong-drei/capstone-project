# Staff-assisted account recovery

This feature recovers active patient accounts during a clinic visit. Receptionists use the existing `staff` role; admins have the same recovery access. It uses the installed patient audit and SMS/authentication schema without a migration or new dependency.

## Clinic workflow

1. Patients select **Forgot password?** on login for instructions to visit reception.
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
