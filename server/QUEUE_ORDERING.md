# Queue ordering

E-KALUSUGAN alternates priority and regular turns. Within each group, online/appointment and staff walk-in tickets share one entry order. Registration remains available after consultations start; dentist availability, capacity, duplicate-ticket and daily-registration checks still apply.

Doctor-unavailable holds are an explicit exception: staff-confirmed held returns go ahead of ordinary waiting tickets in confirmation order. They never interrupt a called/serving patient. Next-day returns receive an H number while retaining their record and original number. See [24-hour held tickets](QUEUE_HOLDS.md) for lifecycle, migration, and deployment requirements.

## Service rules

1. A called or serving patient keeps their turn. No new ticket or return interrupts them.
2. Start with priority when nobody has been called today in that clinic category. After each call, prefer the opposite group: priority, regular, priority, regular.
3. Within each group, serve tickets by server-recorded ticket-issued time across app and walk-in sources. Staff-confirmed physical arrival and appointment time do not determine order.
4. If the preferred group is empty, serve the available group. The next preference follows the type of the patient actually called. New arrivals do not reset alternation.
5. A staff-confirmed return keeps its number and classification but uses its return time to rejoin behind entries already waiting in that group. Both groups continue taking alternating turns.

Priority eligibility is validated during registration. An app request for priority requires an approved, unexpired patient category. Staff walk-ins require a priority category, with senior eligibility also determined from age. This scheduler consumes the validated ticket `type`; it does not let patients claim priority by changing their ticket prefix. There are no extra ordering levels among senior, PWD and pregnant patients.

## Ordering data

The implementation uses existing `queues` fields; this update needs no migration:

| Field | Purpose |
| --- | --- |
| `category` and `created_at` | Callers restrict the projection to the relevant clinic queue and day. |
| `type` | Select the priority or regular group. |
| `is_walk_in` | Identify the registration source; it does not determine service order. |
| `created_at` | Original queue-entry time, recorded by the server. Booking creation time and appointment time do not grant precedence. |
| `returned_at` | Effective entry time after a confirmed return. The original `created_at` remains intact for history. |
| `last_called_at` | Identify the last actual called ticket today in the same category; its `type` determines the next preferred group. |
| `id` | Stable tie-breaker for entries with equal recorded timestamps. |

Effective entry order is `returned_at`, when present, otherwise `created_at`. At equal timestamps, ordinary entries precede returns; remaining ties use ascending `id`. These rules use the timestamps stored in MySQL, rather than client clocks. `AQ01`, `AP01`, `Q01` and `P01` remain identifiers from independent counters and are never compared as queue positions.

## Algorithm

The shared pure function is `src/utils/queueOrder.js: projectQueue(waiting, lastCalled)`.

1. Split waiting tickets into priority and regular groups.
2. Sort each group by effective entry order across both registration sources.
3. Prefer regular if the last actual called ticket was priority; otherwise prefer priority.
4. If the preferred group is empty, switch to the other group.
5. Append the first ticket in that group, switch the preferred group, and repeat until both groups are empty.

This produces the complete projected order without modifying the supplied tickets. A 1:1 priority/regular ratio applies while both groups have patients. Consecutive patients of the same type are served when the other group is empty.

## Examples

All times below are illustrative server-recorded entry times.

### A late app request

| Ticket | Entry | Type/source |
| --- | --- | --- |
| Q05 | 8:00 AM | Regular walk-in |
| Q06 | 8:05 AM | Regular walk-in |
| AQ03 | 8:10 AM | Regular app |
| Q07 | 8:15 AM | Regular walk-in |

With no other waiting tickets, the order is **Q05 -> Q06 -> AQ03 -> Q07**. All four are regular, so ticket-issued time determines their order across registration sources. Completed, cancelled or missed tickets do not take waiting turns.

### Alternating priority and regular

If Q05 entered before Q06, P01 entered before AP01, and nobody has been called today, the order is **P01 -> Q05 -> AP01 -> Q06**. If the last called patient was priority, it is **Q05 -> P01 -> Q06 -> AP01**. The current called/serving patient continues normally.

If AP01 is the only priority ticket, AQ01 was issued at 1:13 PM, Q01 was issued at 1:19 PM, and nobody has been called today, the order is **AP01 -> AQ01 -> Q01**. After AP01, the earlier regular app ticket precedes the later walk-in. With no priority tickets left, regular patients continue in entry order.

### A confirmed return

If AQ01 misses its turn and staff confirms its return after AQ02 and Q03 are already waiting, AQ01 must follow both of those regular entries. AQ01 keeps its ticket number and uses its return time for re-entry. Priority patients take alternating turns between regular entries when available. Priority returns follow the equivalent entry-time rule within the priority group.

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

The checks cover priority/regular alternation, entry order across registration sources, empty groups, later arrivals, returns, timestamp ties, repeated call-next/projection agreement, open intake and admission limits, wait estimates, and SMS ordering. Transaction fixtures also exercise concurrent calls/skips and rollback behavior. Optional MySQL tests require their existing explicit opt-in and an appropriate test database; mocked tests alone do not verify the deployed database or real SMS delivery.

This update changes the next selection immediately for existing waiting tickets, using their existing timestamps and the last called ticket's type. Ticket numbers, history, and currently called/serving visits are preserved. Arrival means ticket issuance, so this policy does not guarantee physical-arrival order or a maximum waiting time.
