# School ERP — Next Implementation Plan

Updated: 2026-09-03
Repository baseline: `phase6-notices` on top of `main` at `fb93fec1`

## Current verified state

- Phase 1 Production Security and Multi-Tenancy: `COMPLETED` and retained as a regression gate.
- Phase 2 Core Administration security/ownership exit gate: `COMPLETED` and retained as a regression gate.
- Phase 3 Attendance and Administration: `COMPLETED` and retained as a regression gate.
- Phase 4 Fees and Financial Core: `COMPLETED` for implementation; fixture-dependent populated-payment reversal acceptance remains tracked.
- Phase 5 Exams and Academic Results: `COMPLETED` and retained as a regression gate.
- Phase 6 Homework, Notices and Timetable: `IN_PROGRESS`; Homework and Notices are implemented and focused verification is green.

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
- shared validation contracts and explicit RBAC permissions;
- admin management UI and authenticated API routes;
- focused API/E2E coverage for scheduling, published visibility, class targeting and student write denial.

## Next delivery

1. Implement timetable data model with server-side conflict validation.
2. Add teacher timetable view.
3. Add student timetable view.
4. Integrate Homework attachments with the existing private document/storage architecture.
5. Add consolidated Phase 6 API/E2E regression coverage.
6. Preserve Phase 1–5 regression gates.

## Development/deployment quota policy

To conserve the Vercel Hobby deployment quota, future work follows a batch-release workflow:

1. Keep `main` production-safe and untouched during feature development.
2. Create one feature branch for a coherent vertical slice.
3. Make related code changes directly on GitHub without pushing unnecessary intermediate commits.
4. Run builds, tests, and local browser/API verification through Desktop Commander.
5. Review the complete slice and fix issues before opening the PR.
6. Open one PR for the completed slice; avoid repeated push/deploy cycles during implementation.
7. Merge only after review and verification, allowing the single production deployment from `main` to be the release event.
8. Use Vercel preview deployments only when a deployed-environment check is genuinely necessary.

This policy is now the default workflow for all subsequent School ERP development.

## Verification rule

Every production-affecting implementation must preserve tenant isolation and RBAC, add business-critical tests, pass relevant builds/tests and Phase 1/2 security gates, verify deployment-sensitive behavior when required, and update affected living documentation.
