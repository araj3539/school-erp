# School ERP — Phase 3 Student Administration Progress

Review date: 2026-09-01
Branch: `main`
Status: `IN_PROGRESS`

## Implemented

### Student list query contract
- Student list uses `StudentQuerySchema` so search, status, class, section, and pagination reach the controller.
- Teacher list uses `TeacherQuerySchema` so search and status filters are validated before querying.
- Tenant scoping remains enforced by authenticated school context.

### Student bulk import hardening
- New hardened bulk import controller validates every row with `CreateStudentSchema` before writes.
- Duplicate admission numbers inside the uploaded file are rejected.
- Existing admission numbers are preflighted before any write.
- Empty workbooks are rejected explicitly.
- Existing Excel 5 MB upload and 5,000-row parser limits are retained.
- All successful student inserts and their audit events run inside one MongoDB transaction.
- Any validation failure prevents partial import.

### Student export hardening
- Export now accepts the validated student query contract.
- Search, status, class, and section filters are honored.
- Teacher exports remain limited to assigned classes.
- Export remains tenant-scoped.

## Verification

Added `server/e2e/phase3-student-bulk.spec.ts` covering:
- invalid-row atomic rejection
- no partial insert after failed import
- duplicate admission-number rejection
- filtered Excel export

Existing Phase 3 student search coverage remains mandatory.

## Acceptance gate

`test:e2e:phase3` now includes the student bulk suite in addition to attendance, attendance bulk, and student search.

The new student bulk suite is awaiting live local E2E execution against the deployed Render API before this slice is marked green.

## Next work after green

- Wire the existing Students UI Import/Export controls to the hardened endpoints.
- Add teacher administration E2E coverage for search/status/pagination.
- Continue with admission/enrollment workflow.
