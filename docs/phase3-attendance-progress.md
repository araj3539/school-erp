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
- Monthly report acceptance now verifies invalid month rejection and a valid academic-year month.

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

### Bulk attendance and spreadsheet workflow
- `POST /api/v1/attendance/bulk` is implemented.
- `POST /api/v1/attendance/import` validates all spreadsheet rows before mutation.
- `GET /api/v1/attendance/export` is tenant-safe and filter-aware.
- Spreadsheet imports resolve students by admission number within the selected tenant/class/section.
- Existing attendance days remain corrections and require principal/super-admin authorization.
- Attendance writes and audit events run transactionally.

Rules:
- 1–31 entries per request/import
- maximum 5,000 student records
- every class, section and active student is tenant-validated
- teacher class ownership is enforced
- every date must belong to the current academic year
- duplicate spreadsheet attendance rows are rejected

### UI correctness
- Attendance editing uses explicit local draft state rather than mutating React Query responses.
- Existing records are presented as correction workflows.
- Save loading, success and authorization/error states are surfaced.
- Attendance spreadsheet import/export controls are available in the UI.

## Reporting/timezone decision

Attendance uses **date-only semantics** for school reporting. `YYYY-MM-DD` represents the school calendar date and is not converted through the server's local timezone. Existing calendar-date utilities preserve this invariant. No additional persisted timezone field is introduced in Phase 3 because the current product model does not yet require timestamp-to-local-date conversion.

## Verification

Phase 3 now includes explicit reporting and teacher-administration acceptance suites:

```text
Attendance:        4 passed
Bulk attendance:   1 passed
Student search:    1 passed
Student bulk:      1 passed
Teachers:          1 passed
Attendance report: 1 passed
Phase 3 summary:   PASS
```

Phase 1 and Phase 2 regression gates also pass:

```text
Phase 1:    8 passed
Documents:  7 passed
Payments:   5 passed
Audit:      3 passed
Roles:      2 passed
```

Client and server production builds pass. The local working tree is clean after pulling the GitHub implementation.

## Phase 3 status

The Phase 3 implementation and automated acceptance gate are now green. The remaining work after this phase is outside the Phase 3 exit gate: deeper product polish, broader UI/browser acceptance, dashboard aggregation/performance, sensitive document delivery/privacy audit, and subsequent ERP modules.
