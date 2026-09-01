# School ERP — Phase 3 Attendance Progress

Review date: 2026-09-01
Branch: `main`
Phase state: `IN_PROGRESS`

## Implemented in this increment

### 1. Academic-year-aware attendance marking
Attendance creation and correction resolve the school-configured academic year and reject dates outside its `[startDate, endDate)` range.

This prevents attendance from being written against a school period that is not currently active.

### 2. Correction authorization
Creating a new attendance record continues to use the existing `attendance:write` permission.

When a record already exists for the same school/class/section/date, the request is treated as a correction. Corrections are restricted to:
- `principal`
- `super_admin`

Teachers can continue to mark attendance for their assigned classes but cannot overwrite an existing attendance record through the marking endpoint.

### 3. Correction auditing
Corrections generate an `Attendance` `CORRECT` audit event with the tenant `schoolId` explicitly included in the audit payload.

### 4. Monthly-report academic-year guard
Monthly attendance reports verify that the requested month begins inside the school-configured current academic year and return the academic-year name with the report.

### 5. Calendar-date API contract
Attendance API input and student attendance date-range validation now use `DateOnlySchema`/`AttendanceDateRangeSchema` with strict `YYYY-MM-DD` values.

This matches the controller's calendar-day parsing and prevents ISO datetime timezone offsets from changing or rejecting the represented school day.

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
- `shared/src/schemas/schemas.test.ts`

Regression tests added for:
- valid calendar attendance dates
- invalid calendar dates
- rejection of datetime values for attendance input

Vercel checks have been passing for the implementation commits. Render has automatic deploy enabled on `main`; deployment acceptance remains required after the latest attendance commit reaches the live service.

The Phase 1 and Phase 2 security gates remain mandatory regression gates.

## Next Phase 3 work

1. Add explicit attendance correction E2E coverage for teacher denial and principal success.
2. Add duplicate-date and out-of-academic-year live acceptance cases.
3. Harden monthly/reporting timezone semantics if school-local reporting requires an explicit timezone field.
4. Add bulk correction/import workflows only after the single-record correction path is stable.
5. Keep student/teacher attendance views tenant- and ownership-scoped.
