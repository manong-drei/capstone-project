# Dashboard data synchronization

All mounted views that display API data now refresh every five seconds, on focus/reconnect, and after successful changes in this browser. A shared timer and a payload-free BroadcastChannel replace separate polling timers. The waiting-room queue monitor keeps its existing one-second polling and immediate queue notifications.

| Area | Live data covered |
| --- | --- |
| Admin dashboard | Totals, recent appointments, doctors, live queue, pending leave and failed SMS counts |
| Admin management | Staff/admin accounts, paginated patient accounts, doctors and availability records, leave list and review impacts, patient history |
| Admin activity and analytics | SMS jobs and threshold, audit logs and their current filters/page, forecast/history charts |
| Doctor dashboard | Queue, completed patients, booked/walk-in counts, availability and capacity |
| Doctor tabs | Patient history, saved consultation notes, analytics, reports, daily entries, leave requests |
| Patient dashboard and tabs | Personal queue, current line, dentist availability/leave, profile/priority eligibility, appointment history |
| Staff dashboard and forms | Queue, availability, recovery search results, walk-in patient suggestions |
| Shared pages | Dashboard identity, My Profile for every role, patient demographics and visits, merge search results |

Requests for one live loader do not overlap. Navigating away or changing its query aborts obsolete requests. Background refreshes avoid loading placeholders; existing error handling and automatic retries remain.

Profile editing, unsaved daily report entries, capacity limits and SMS threshold drafts are preserved. Recovery verification and selected walk-in patient details remain snapshots while the operator completes the form; the server validates changes when submitted. Leave review acknowledgments reset when affected bookings change.

This is polling synchronization, with up to five seconds plus request time for changes from other devices. Hidden/offline tabs pause background requests and refresh when visible/online again. Forecast polling reads the current generated files; it does not retrain the forecasting model. No server-push service or dependency was added.

Validation: 35 synchronization browser checks cover 25 routes, search forms, cross-tab authentication, reconnects, slow requests, failed refreshes, and draft preservation. The 102 existing targeted dashboard regression checks also passed after fixes and updated selectors. The production build and ESLint checks passed. Tests use mocked API responses; physical devices and production load were not tested.
