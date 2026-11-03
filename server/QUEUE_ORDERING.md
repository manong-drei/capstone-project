# Queue ordering and protection against queue jumping

E-KALUSUGAN keeps its existing online/appointment and staff walk-in registration routes, separate ticket counters, capacity limits, and presence checks. New online tickets cannot take a regular turn ahead of earlier regular walk-ins who are still waiting for their first call. Registration remains available after consultations start; dentist availability, capacity, duplicate-ticket and daily-registration checks still apply.

## Service rules

1. A called or serving patient keeps their turn. No new ticket or return interrupts them.
2. Verified priority tickets go before regular waiting tickets. Priority tickets use one FIFO entry order across app and walk-in sources; there is no source alternation within priority.
3. Regular tickets retain source alternation when both next candidates are eligible. A new regular app ticket is ineligible while an earlier regular walk-in still waits for its first call. The scheduler selects the walk-in instead of leaving the chair idle.
4. Later walk-ins do not become blockers for an earlier app ticket. The boundary is based on each ticket's recorded entry, not a moving count of walk-ins.
5. A staff-confirmed return keeps its number and priority classification but rejoins behind entries already waiting in that priority group. A regular return must wait for earlier regular entries from both sources. A priority return follows earlier priority entries but still precedes regular patients.

Priority eligibility is validated during registration. An app request for priority requires an approved, unexpired patient category. Staff walk-ins require a priority category, with senior eligibility also determined from age. This scheduler consumes the validated ticket `type`; it does not let patients claim priority by changing their ticket prefix. There are no extra ordering levels among senior, PWD and pregnant patients.

## Ordering data

The implementation uses existing `queues` fields; this update needs no migration:

| Field | Purpose |
| --- | --- |
| `category` and `created_at` | Callers restrict the projection to the relevant clinic queue and day. |
| `type` | Select priority before regular. |
| `is_walk_in` | Distinguish the two registration sources. |
| `created_at` | Original queue-entry time, recorded by the server. Booking creation time and appointment time do not grant precedence. |
| `returned_at` | Effective entry time after a confirmed return. The original `created_at` remains intact for history. |
| `last_called_at` | Distinguish walk-ins still awaiting their first call from patients whose turn was already handled. |
| `id` | Stable tie-breaker for entries with equal recorded timestamps. |

Effective entry order is `returned_at`, when present, otherwise `created_at`. At equal timestamps, ordinary entries precede returns; remaining ties use ascending `id`. These rules use the timestamps stored in MySQL, rather than client clocks. `AQ01`, `AP01`, `Q01` and `P01` remain identifiers from independent counters and are never compared as queue positions.

## Algorithm

The shared pure function is `src/utils/queueOrder.js: projectQueue(waiting, lastCalled)`.

1. Split waiting tickets into priority and regular groups.
2. Sort priority tickets by effective entry order and append them to the projected line.
3. Sort regular tickets by effective entry order and separate them into app and walk-in lists.
4. Prefer the opposite source from the last projected priority ticket, or from the last actual called ticket if there are no waiting priority tickets. With no previous call, prefer app tickets, subject to the same eligibility check.
5. Check the first ticket in that source:
   - A return is eligible only when no earlier regular entry remains in either list.
   - A first-turn app ticket is eligible only when no earlier first-turn regular walk-in remains.
   - An ordinary walk-in is eligible.
6. If that candidate is missing or ineligible, select the candidate from the other source.
7. Remove the selected ticket from the simulated waiting lists, switch the preferred source, and repeat.

This produces the complete projected order, including tickets that are blocked now but become eligible after earlier patients. It does not hide blocked tickets from the monitor. The earliest remaining regular entry is always eligible, so the simulation makes progress without waiting for new arrivals. It works on copies and does not modify the supplied tickets.

Regular alternation is a preference, not a guaranteed 1:1 ratio. It pauses whenever selecting the app source would overtake a protected walk-in, or a returning patient would overtake existing entries. The policy is intentionally not global FIFO for regular patients: an eligible walk-in may still precede an older app ticket when the walk-in source is next.

## Examples

All times below are illustrative server-recorded entry times.

### A late app request

| Ticket | Entry | Type/source |
| --- | --- | --- |
| Q05 | 8:00 AM | Regular walk-in |
| Q06 | 8:05 AM | Regular walk-in |
| AQ03 | 8:10 AM | Regular app |
| Q07 | 8:15 AM | Regular walk-in |

With no other waiting tickets, the order is **Q05 -> Q06 -> AQ03 -> Q07**. Q05 and Q06 block AQ03, but the later Q07 does not. Completed, cancelled or missed tickets are not waiting blockers.

### Verified priority

If Q05 and Q06 are waiting regular patients and P01 entered before AP01, the order starts **P01 -> AP01**, followed by the regular projection. AP01 can precede regular patients because it is verified priority, but cannot precede the earlier priority walk-in P01. The current called/serving patient continues normally.

### A confirmed return

If AQ01 misses its turn and staff confirms its return after AQ02 and Q03 are already waiting, AQ01 must follow both of those regular entries. AQ01 keeps its ticket number and uses its return time for re-entry. A later newcomer does not change which entries were earlier than that return, although normal source alternation still applies after eligibility is reached. Priority returns follow the equivalent rule within the priority group.

The existing 10-minute return deadline, staff/doctor presence confirmation, two calls with 15-second waits, terminal expiry, and final no-show on a second missed turn remain in place. See [Missed-call grace period](QUEUE_GRACE_PERIOD.md).

## Where the rule is used

- `Queue.projectWaiting()` applies the helper to today's waiting tickets in one category. `Queue._callNext()` uses the first result.
- `Queue.findTodayActive()` uses the same helper for staff, doctor and admin lists, patient public queue lines, and the clinic monitor.
- `Queue.getWaitEstimate()` derives positions and estimates from that same projected waiting order.
- Ticket creation and the SMS worker use `Queue.projectWaiting()` for initial positions, suppression and approaching-turn alerts. Existing SMS deduplication and delivery checks still apply.
- The patient return notice and dashboard Help explain the re-entry policy.

Registration, call-next, skip and return retain the existing category transaction lock and row checks. This database lock prevents concurrent conflicting actions; it does not close intake to patients. No new API, schema, dependency, device, or location tracking is introduced. Existing bookings remain records and capacity reservations; they do not automatically advance a newly issued queue ticket.

## Verification

From `server/`:

```sh
node --test test/queueOrder.test.js test/queueRegistration.test.js test/queueModel.test.js test/queueGrace.test.js test/queueWaitEstimate.test.js test/sms.test.js
npm test
```

The checks cover older-walk-in protection, later arrivals, priority FIFO, returns, timestamp ties, repeated call-next/projection agreement, open intake and admission limits, wait estimates, and SMS ordering. Transaction fixtures also exercise concurrent calls/skips and rollback behavior. Optional MySQL tests require their existing explicit opt-in and an appropriate test database; mocked tests alone do not verify the deployed database or real SMS delivery.

This update changes the next selection immediately for existing waiting tickets, using their existing timestamps. Ticket numbers, history, and currently called/serving visits are preserved. Strict priority means regular patients wait while eligible priority patients remain; this policy does not guarantee a maximum waiting time or physical-arrival order.
