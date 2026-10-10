# Missed-call grace period

Run `npm run migrate:queue-grace` from `server` before starting the updated backend and frontend together. The migration is safe to rerun and retains existing ticket statuses and timestamps. Existing serving tickets stay serving.

Calling a ticket sets `called`. Staff or a doctor confirms physical presence to begin `serving`. Call again becomes available after 30 seconds; skipping requires another 30 seconds after the second call.

The first skip creates a 10-minute return window and calls the next patient in one transaction. Staff-confirmed returns keep the same ticket and take the next opening, ordered by return time. They do not interrupt an already called or serving patient. A second missed turn ends as a final no-show.

The backend sweeps expired missed tickets at startup and every five seconds, independently of SMS. Every ticket action also checks expiry under the category lock. Record arrivals before the deadline; recording a return afterward cannot revive a terminal ticket. The patient app and monitor show deadlines in Asia/Manila. No additional SMS is sent.

## API changes

- `POST /api/queue/call-next` returns a ticket with `status: called`.
- Staff/doctor `POST /api/queue/:id/recall` returns the recalled ticket.
- Staff/doctor `POST /api/queue/:id/skip` returns `{ queue, next_queue }`; `next_queue` is null when nobody is waiting.
- Staff/doctor `POST /api/queue/:id/return` returns the original ticket in `waiting`.
- `PATCH /api/queue/:id/status` accepts presence (`called → serving`), completion (`serving → done`), and cancellation. Direct recall, skip, return, and no-show changes through this endpoint are rejected.
- `/api/queue/status` retains its existing number fields and adds `current_status`.
- `/api/queue/me` returns an active ticket or the latest ticket if it ended as no-show. No-show is terminal and does not block requesting a new ticket under normal daily/capacity limits.

## Checks

Run `npm test` in `server` and the queue browser tests in `capstone-app`. For the optional MySQL check, set `QUEUE_DB_TESTS=true` and run `node --test test/queueGraceDb.test.js`. It uses temporary tables without changing existing patient or ticket data.
