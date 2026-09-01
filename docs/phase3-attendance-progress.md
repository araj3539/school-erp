# School ERP — Phase 3 Attendance & Administration Progress

Review date: 2026-09-01
Branch: `main`
Phase state: `IN_PROGRESS`

## Implemented in this increment

### 1. Academic-year-aware attendance marking
Attendance creation and correction resolve the school-configured academic year and reject dates outside its `[startDate, endDate)` range.

### 2. Correction authorization
Creating a new attendance record continues to use the existing `attendance:write` permission. Existing records are correction operations restricted to `principal` and `super_admin`.

### 3. Correction auditing
Corrections generate an `Attendance` `CORRECT` audit event with the tenant `schoolId` explicitly included in the audit payload.

### 4. Monthly-report academic-year guard
Monthly attendance reports verify that the requested month begins inside the school-configured current academic year and return the academic-year name.

### 5. Calendar-date API contract
Attendance write/query date input and student attendance date ranges use strict `YYYY-MM-DD` calendar-date semantics.

### 6. Attendance list-filter validation
The attendance collection route validates with `AttendanceQuerySchema`, preserving class, section, single-date, and date-range filters.

### 7. Tenant resolution consistency
Attendance student views resolve the effective tenant through the shared `getTenantId()` helper.

### 8. Bounded bulk attendance workflow
Added `POST /api/v1/attendance/bulk`.

Rules:
- accepts 1–31 attendance entries per request
- rejects payloads above 5000 student records
- rejects duplicate class/section/date entries in the same request
- resolves tenant context from authenticated request state
- validates every class, section, and active student against the tenant
- enforces teacher class ownership for every entry
- enforces the current academic year for every entry
- treats existing days as corrections and restricts them to principal/super-admin
- creates/updates all attendance days and their audit events in one MongoDB transaction
- rolls the whole request back if any entry fails validation or persistence

### 9. Student administration query contract
The student collection route now validates with `StudentQuerySchema`, so the existing controller search/filter logic is actually reachable by API clients.

Supported filters include:
- `search` across first name, last name, admission number, and phone
- `status`
- `classId`
- `sectionId`
- `page` / `limit`

### 10. Teacher administration query contract
The teacher collection route now validates with `TeacherQuerySchema`, so existing search/status filtering and pagination are reachable consistently.

## Existing safeguards retained

- tenant scope through authenticated `schoolId` / resolved tenant context
- teacher class ownership checks
- student self-access checks
- parent-child ownership checks
- class/section ownership validation
- active-student validation when marking attendance
- duplicate student protection within a single attendance submission
- unique school/class/section/date index protection
- existing pagination and date-range filtering
- tenant-scoped student and teacher administration queries

## Verification status

Attendance acceptance gate: `4/4` passed.

Bulk attendance acceptance: `1/1` passed.

Student/teacher query contract changes are committed and awaiting live E2E verification against the latest Render deployment.

The Phase 1 and Phase 2 security gates remain mandatory regression gates.

## Next Phase 3 work

1. Verify student search/status/class/section/pagination against the live API.
2. Add teacher search/status/pagination acceptance coverage.
3. Add administration bulk student import/export hardening and validation.
4. Add admission/enrollment workflow safeguards.
5. Complete class/section administration improvements.
6. Harden monthly/reporting timezone semantics when school-local reporting needs an explicit timezone field.
