# Doctor-unavailable ticket holds

Staff can hold dental tickets when the doctor cannot return. The fixed reason is **Doctor unavailable — emergency or meeting**. Waiting, called, and missed tickets still inside their 10-minute return window are eligible. A patient receiving treatment keeps their turn. Doctor availability and intake remain controlled separately.

## Deployment

From `server/`, run `npm run migrate:queue-holds` against the intended application database **before deploying the backend**, then deploy the frontend. The idempotent migration adds `held`/`expired` statuses, `held_expires_at`, `held_reactivated_at`, `held_insert_order`, `original_queue_number`, and a hold-expiry index. It preserves existing tickets. The older grace/no-show migrations preserve the added statuses if rerun.

The existing queue-expiry worker sweeps at startup and every five seconds, independently of SMS. Keep the backend running for automatic state updates. Restore requests enforce the exact deadline even between sweeps; downtime does not extend a deadline.

## Staff workflow

- Select **Cancel remaining — doctor unavailable**, choose the fixed reason, and confirm. The dialog explains that all eligible dental tickets at confirmation will be held for 24 hours. The server returns the actual affected count.
- For one waiting ticket, select Cancel and choose the same reason. Other cancellation reasons retain their usual final behavior.
- The Held tickets section appears only while unexpired holds exist. It shows patient, number, reason, and expiry date/time in Asia/Manila.
- Select **Patient Present** only after confirming physical presence. The restored ticket joins ahead of ordinary waiting tickets without interrupting an already called/serving patient. Multiple held returns follow the order staff confirms them.

Holding leaves the linked appointment open. A successful restored visit completes that same appointment. Expiry cancels only the linked open appointment and retains the ticket as `expired`, rather than a patient no-show. Repeating a hold does not extend its deadline. A restored ticket can receive a fresh hold if the doctor becomes unavailable again.

## Ordering and numbering

Restoring on the ticket's current clinic day keeps its number. Restoring on a later day allocates `H01`, `H02`, etc. from an independent daily held-return sequence. Both priority and regular patients use this series; their existing classification and registration source remain unchanged. The same queue ID, patient, appointment, services, and creation timestamp remain. `original_queue_number` preserves the original number for history.

`held_reactivated_at` determines a restored ticket's operational clinic day. Creation time still determines original registration dates and daily registration limits. Normal clinic-day behavior applies after restoration; the old hold deadline no longer expires a restored ticket.

`held_insert_order` is a transactional sequence, so simultaneous confirmations cannot tie. It is consumed at call-next. After pending held returns, ordinary tickets resume priority/regular alternation based on the last actual called type. The shared projection drives call-next, displays, wait estimates, and SMS positions. Ordinary missed-call returns keep their existing group re-entry rule.

Patients see held/expired notices and cannot register another active ticket while an unexpired hold exists. Approaching-turn SMS is suppressed while held; existing SMS deduplication still applies after restoration.

## API

All three endpoints require an authenticated **staff** account and take no request body:

| Method and path | Result |
| --- | --- |
| `POST /api/queue/hold-remaining` | `{ held_count, held_expires_at }`; zero eligible tickets is a successful no-op. |
| `POST /api/queue/:id/hold` | Updated held dental ticket; an existing unexpired hold keeps its deadline. |
| `POST /api/queue/:id/reactivate` | Updated waiting ticket, including its current/original number and reactivation metadata. |

Invalid IDs return 400; other roles return 403; missing tickets return 404; invalid transitions, conflicting active tickets, or elapsed holds return 409. Mutations, counters, and appointment changes share the existing category transaction lock and roll back together on failure.

The monitor announces **Inserting held ticket. Queue number …** twice per observed reactivation while announcements are enabled. It establishes a baseline at load and does not replay initial or muted events. Restorations observed in one poll are queued with normal serving speech. Cross-device changes use the existing one-second polling; local browser changes also trigger refresh.

## Checks

`npm test` covers the model, routes, migration, and worker with database mocks. To exercise real SQL against isolated temporary tables, set `QUEUE_DB_TESTS=true` and run `node --test test/queueHoldsDb.test.js test/queueGraceDb.test.js test/queueModel.test.js`, then clear that environment variable. These checks apply migrations only to temporary shadow tables and preserve stored application data.

Frontend checks are in `staff-dashboard.spec.js`, `queue-announcements.spec.js`, and `patient-queue.spec.js`. Browser speech tests mock device voices; verify the clinic speaker/device during deployment.
