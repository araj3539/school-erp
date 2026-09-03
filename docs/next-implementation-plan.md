# School ERP — Next Implementation Plan

Updated: 2026-09-03
Repository baseline: `main` at `08d27b91`

## Current verified state

- Phase 1 Production Security and Multi-Tenancy: `COMPLETED` and retained as a regression gate.
- Phase 2 Core Administration security/ownership exit gate: `COMPLETED` and retained as a regression gate.
- Phase 3 Attendance and Administration: `COMPLETED` and retained as a regression gate.
- Phase 4 Fees and Financial Core: `COMPLETED` for implementation; fixture-dependent populated-payment reversal acceptance remains tracked.
- Phase 5 Exams and Academic Results: `COMPLETED` and retained as a regression gate.
- Phase 6 Homework, Notices and Timetable: `IN_PROGRESS`; Homework, Notices and the first Timetable vertical slice are implemented.

## Phase 6 completed slices

### Homework
- tenant/RBAC-safe CRUD and recipient isolation;
- academic/class/section/subject ownership validation;
- bounded attachment metadata;
- audited create/update operations;
- admin assignment/filtering UI.

### Notices
- tenant-scoped school/class/section targeting;
- publication scheduling and expiry;
- recipient isolation for students, linked parents and class-assigned teachers;
- principal/super-admin write boundary with audited create/update;
- shared validation contracts, RBAC permissions, management UI and focused API/E2E coverage.

### Timetable — current slice
- tenant-scoped academic-year timetable entries;
- class/optional-section, subject and active-teacher ownership validation;
- HH:mm time-range validation;
- server-side class, teacher and room overlap conflict detection;
- teacher, student and parent recipient scoping;
- principal/super-admin create/update/delete boundary with audit events;
- weekly timetable UI with manager filters and role-specific views;
- focused schema and API/E2E regression coverage.

## Next delivery

1. Complete Timetable editing/management polish and full browser QA.
2. Integrate Homework attachments with the existing private document/storage architecture.
3. Add consolidated Phase 6 API/E2E regression coverage for Homework, Notices and Timetable.
4. Preserve Phase 1–5 regression gates.

## Development/deployment quota policy

To conserve the Vercel Hobby deployment quota, future work follows a batch-release workflow:

1. Keep `main` production-safe and untouched during feature development.
2. Create one feature branch for a coherent vertical slice.
3. Make related code changes directly on GitHub without unnecessary intermediate deployment cycles.
4. Run builds, tests, and local browser/API verification through Desktop Commander.
5. Review the complete slice and fix issues before opening the PR.
6. Open one PR for the completed slice and preferably squash the feature history before release.
7. Merge only after review and verification; let the single production deployment from `main` be the release event.
8. Use Vercel preview deployments only when a deployed-environment check is genuinely necessary.

This policy is the default workflow for all subsequent School ERP development.

## Verification rule

Every production-affecting implementation must preserve tenant isolation and RBAC, add business-critical tests, pass relevant builds/tests and Phase 1/2 security gates, verify deployment-sensitive behavior when required, and update affected living documentation.
