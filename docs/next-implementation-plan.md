# School ERP — Next Implementation Plan

Updated: 2026-09-03
Repository baseline: `ui-refresh-legacy-merge` after Phase 5 completion and Phase 6 homework slice

## Current verified state

- Phase 1 Production Security and Multi-Tenancy: `COMPLETED` and retained as a regression gate.
- Phase 2 Core Administration security/ownership exit gate: `COMPLETED` and retained as a regression gate.
- Phase 3 Attendance and Administration: `COMPLETED`; attendance, bulk attendance, student search/bulk, teacher administration, attendance-report and dashboard acceptance suites were verified green.
- Phase 4 Fees and Financial Core: `COMPLETED` for implementation; focused financial regression coverage and available deployed reconciliation/receipt acceptance checks were green. Full populated-payment reversal acceptance remains fixture-dependent.
- Phase 5 Exams and Academic Results: `COMPLETED`; exam setup, marks entry, grade rules, publishing, audited correction and report-card delivery were implemented and covered by focused acceptance/regression work.
- Phase 6 Homework, Notices and Timetable: `IN_PROGRESS`; the homework vertical slice is implemented and shared/server/client builds pass.

## Phase 6 homework slice — completed

- shared Zod contracts for homework create/update/query;
- bounded attachment metadata and assigned/due date validation;
- tenant-scoped Homework model and query indexes;
- authenticated list/detail/create/update API routes;
- teacher class/subject write authorization;
- student class/section read isolation;
- parent linked-child read isolation;
- academic-year/class/subject/section ownership validation;
- create/update audit events;
- admin Homework page with filters and assignment form;
- Homework navigation and route.

## Verification record

```text
Shared build: PASS
Server build: PASS
Client build: PASS
```

The broader shared Vitest command currently encounters a repository test-tooling problem: tracked generated `shared/src/**/*.js` files are CommonJS while `shared/package.json` declares ESM. The existing permission suite also loads stale generated permission artifacts. This is recorded as technical debt and is not being counted as a Phase 6 feature failure.

## Next delivery

Phase 6 continuation:

1. implement tenant/RBAC-safe Notices;
2. add scheduled/class-specific notice targeting;
3. implement timetable model with conflict validation;
4. add teacher and student timetable views;
5. integrate homework attachments with the existing private document/storage architecture;
6. add focused API/E2E coverage for homework, notices and timetable;
7. preserve Phase 1–5 regression gates.

## Verification rule

Every production-affecting implementation must:

1. preserve tenant isolation and RBAC;
2. add business-critical tests;
3. pass relevant builds and tests;
4. pass Phase 1/2 security gates;
5. verify deployed behavior when the change is deployment-sensitive;
6. update affected living documentation.
