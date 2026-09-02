# School ERP — Phase 3 Attendance & Administration Progress

Review date: 2026-09-02
Branch: `main`
Phase state: `IN_PROGRESS`

## Implemented attendance capabilities

### Academic-year and calendar correctness
- Attendance creation and correction resolve the school-configured current academic year.
- Dates outside `[startDate, endDate)` are rejected.
- Attendance write/query inputs use strict `YYYY-MM-DD` calendar-date semantics.
- Student attendance date ranges use the attendance-specific date validator.

### Authorization and tenant isolation
- Teachers can mark attendance only for assigned classes.
- Existing attendance records are corrections and are restricted to `principal` and `super_admin`.
- Student attendance is self-only.
- Parent attendance is limited to linked children.
- Attendance queries use authenticated/resolved tenant context.
- Class, section, and active-student relationships are checked against the tenant.

### Correction auditing
- Corrections emit explicit `CORRECT` audit events with before/after attendance data and tenant context.

### Duplicate protection
- Duplicate students in one submission are rejected.
- A unique school/class/section/date index prevents duplicate attendance days.
- Bulk payloads reject duplicate class/section/date entries.

### Bulk attendance
`POST /api/v1/attendance/bulk` is implemented.

Rules:
- 1–31 entries per request
- maximum 5,000 student records
- every class, section and active student is tenant-validated
- teacher class ownership is enforced
- every date must belong to the current academic year
- existing days are corrections and require principal/super-admin authorization
- attendance writes and audit events run in one MongoDB transaction

### Reporting
- Monthly reports are restricted to the current academic year.
- Reports return the academic-year name.
- Collection queries preserve class, section, date and date-range filters.

## Verification

The verified Phase 3 gate is green:

```text
Attendance:       4 passed
Bulk attendance:  1 passed
Student search:   1 passed
Student bulk:     1 passed
Phase 3 summary:  PASS
```

The Phase 3 attendance acceptance workflow is therefore functionally green at the API/E2E level, but Phase 3 as a whole remains open because the admin UI and reporting/timezone hardening are not complete.

## Remaining attendance work

1. Make the Attendance UI state-driven instead of mutating React Query response objects directly.
2. Wire authorized correction behavior into the UI with clear mark-vs-correct states.
3. Add attendance import/export using the existing bulk service and tenant-safe filters.
4. Add stronger monthly/history/report acceptance coverage, especially around academic-year boundaries.
5. Introduce an explicit school reporting timezone only if the persisted school configuration is sufficient to define the product rule; otherwise design the field first.
6. Add teacher attendance administration E2E coverage where missing.

Phase 1 and Phase 2 security gates remain mandatory regression gates.
