# School ERP — Phase 3 Attendance Progress

Review date: 2026-08-26
Branch: `main`
Phase state: `IN_PROGRESS`

## Implemented in this increment

### 1. Academic-year-aware attendance marking
Attendance creation and correction now resolve the school-configured academic year and reject dates outside its `[startDate, endDate)` range.

This prevents attendance from being written against a school period that is not currently active.

### 2. Correction authorization
Creating a new attendance record continues to use the existing `attendance:write` permission.

When a record already exists for the same school/class/section/date, the request is treated as a correction. Corrections are now restricted to:
- `principal`
- `super_admin`

Teachers can continue to mark attendance for their assigned classes but cannot overwrite an existing attendance record through the marking endpoint.

### 3. Correction auditing
Corrections continue to generate an `Attendance` `CORRECT` audit event and now include the tenant `schoolId` explicitly in the audit payload.

### 4. Monthly-report academic-year guard
Monthly attendance reports now verify that the requested month begins inside the school-configured current academic year and return the academic-year name with the report.

## Existing safeguards retained

- tenant scope through authenticated `schoolId`
- teacher class ownership checks
- student self-access checks
- parent-child ownership checks
- class/section ownership validation
- active-student validation when marking attendance
- duplicate student protection within a single attendance submission
- unique school/class/section/date index protection
- existing pagination and date-range filtering

## Verification status

Source-level review completed for:
- `server/src/controllers/attendanceController.ts`
- `server/src/models/Attendance.ts`
- `server/src/routes/attendanceRoutes.ts`
- `shared/src/schemas/index.ts`
- `server/src/validators/index.ts`

The Vercel status check for the attendance implementation commit is passing. Render has automatic deploy enabled on `main`; the new commit has not yet appeared in the latest Render deploy listing at the time of this record.

A production acceptance run is required after Render has deployed this commit. The Phase 1/Phase 2 gates remain mandatory regression gates.

## Next Phase 3 work

1. Add explicit attendance correction E2E coverage for teacher denial and principal success.
2. Add duplicate-date and out-of-academic-year acceptance cases.
3. Harden timezone/date-range semantics around school reporting dates.
4. Add bulk correction/import workflows only after the single-record correction path is stable.
5. Keep student/teacher attendance views tenant- and ownership-scoped.
