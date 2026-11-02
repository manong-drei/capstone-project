# Doctor leave requests

Install on each database before starting the updated backend:

```sh
npm run migrate:doctor-leaves
```

This adds `doctor_leaves` and preserves existing patient, appointment and daily settings records.

- Doctors use **Leave Requests** to submit an inclusive date range and optional private reason. Requests start pending and do not change availability.
- Admins use **Leave Requests** to review affected bookings/tickets, approve, reject, or cancel approved leave. Approval requires acknowledgement of any affected records, checked again in the registration transaction lock order.
- Doctors can withdraw only their own pending requests. Overlapping pending/approved requests are rejected.
- Only approved leave blocks new appointment bookings and dental queue registration. The daily availability toggle cannot override it. Capacity changes remain immediate and retain the underlying daily availability setting.
- Existing bookings, queue tickets and consultation notes are preserved for staff follow-up. This feature does not send cancellation/rescheduling SMS.
- Leave dates use Asia/Manila. Normal daily availability rules apply after the end date without a scheduled reset job.
- Leave reasons and review notes are returned only through doctor-owned and admin-only endpoints. Shared availability responses expose the active leave end date only.

Doctor endpoints: `GET/POST /api/doctor/leave-requests`, `PATCH /api/doctor/leave-requests/:id/withdraw`.

Admin endpoints: `GET /api/admin/doctor-leaves`, `GET/PATCH /api/admin/doctor-leaves/:id`.

For approval, send `status: "approved"`, optional `review_note`, and, when conflicts exist, `acknowledge_conflicts: true` and the current review's `impact_version`. An outdated review returns 409. Admin decisions are recorded in the existing admin audit log without copying private leave notes into it.
