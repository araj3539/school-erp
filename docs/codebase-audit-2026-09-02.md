# School ERP — Codebase Audit

Review date: 2026-09-02
Baseline: current `main` after `8c248e3`

## 1. Executive result

The repository is a functioning TypeScript modular monolith with strong Phase 1/2 security foundations and a substantially hardened Phase 3 API. The next work should not be a new feature jump; it should finish the user-facing workflows around the verified backend capabilities and close correctness/documentation gaps.

### Verified Phase 3 acceptance state

```text
Attendance:       4 passed
Bulk attendance:  1 passed
Student search:   1 passed
Student bulk:     1 passed
Phase 3 summary:  PASS
```

This is **not** Phase 3 completion. The gate proves the current covered API/E2E workflows, while UI integration, reporting/timezone hardening, teacher administration coverage and admission/admin workflows remain.

## 2. Repository structure

```text
client/    React + TypeScript + Vite admin UI
server/    Express + TypeScript API, controllers, models, services, E2E
shared/    Zod schemas, constants and shared contracts
docs/      phase/audit/implementation records
```

The project remains correctly suited to a modular-monolith architecture for the current scale. No microservice split is justified by the current codebase.

## 3. Security and tenant baseline

### Verified strengths

- authenticated school context is used for tenant-owned operations;
- `getTenantId()` provides the effective tenant boundary, including validated super-admin selected-school context;
- student, teacher, parent and attendance ownership rules are enforced server-side;
- Phase 1 cross-tenant and role/ownership E2E passed;
- Phase 2 document/recovery, payment ownership, AuditLog and role-boundary suites passed;
- refresh-token rotation/replay protection exists;
- request validation and rate limiting remain part of the API boundary;
- financial payment/reversal operations use transaction-safe workflows;
- attendance correction is restricted to principal/super-admin and audited.

These remain regression gates and must not be weakened.

## 4. Attendance findings

### Implemented

- strict `YYYY-MM-DD` date contract;
- academic-year bounds;
- class/section/student tenant validation;
- teacher assigned-class boundary;
- duplicate student prevention;
- unique school/class/section/date index;
- correction authorization;
- before/after correction audit event;
- bounded bulk attendance;
- transactional bulk attendance;
- validated attendance query filters;
- student/parent self/ownership attendance access;
- monthly report academic-year guard.

### Remaining

- UI currently mutates data returned from React Query rather than maintaining explicit editable attendance state;
- correction UX is not yet clearly separated from initial marking;
- spreadsheet import/export is not wired;
- monthly/history/report boundary coverage needs to be expanded;
- school reporting timezone needs an explicit product decision before adding more timezone conversion logic.

## 5. Student administration findings

### Implemented

- validated student search/status/class/section/pagination query contract;
- escaped search behavior;
- hardened student import with preflight validation and atomic transaction;
- duplicate admission-number detection;
- actionable import errors;
- tenant-safe filtered export;
- teacher export limited to assigned classes;
- Phase 3 student search and bulk E2E coverage.

### Remaining

- Students UI Import/Export buttons are currently presentation controls rather than the complete workflow;
- teacher administration needs dedicated E2E acceptance coverage;
- class/section acceptance gaps remain;
- student activity/timeline is not complete;
- admission/enrollment/promotion/transfer/withdrawal workflows need explicit business rules before implementation.

## 6. File/document storage finding

The current server implementation uses **Cloudflare R2** through an S3-compatible client and generates short-lived signed URLs. Backblaze B2 is used for recovery/backup infrastructure.

There is no active Cloudinary implementation under `server/src`.

Therefore, older references in legacy PRD/architecture text that describe Cloudinary as the current file store are stale and must not be treated as implementation truth. `BACKUP_RESTORE.md` already reflects the R2/B2 architecture.

Remaining document work is therefore privacy consistency and authorization auditing, not a Cloudinary-to-R2 migration:

```text
authenticated request
 -> tenant/ownership authorization
 -> short-lived R2 signed URL
 -> optional audit event
```

Recovery access remains a separate privileged workflow.

## 7. Dashboard/reporting finding

The dashboard is tenant-safe but contains repeated date-window database queries in loops for attendance/payment trends. This is acceptable at the current small scale but should be replaced with batched aggregation before larger deployments.

Date calculations also use server-local `Date` operations in dashboard/reporting code. A school-local reporting timezone should be defined before this is expanded.

## 8. Frontend findings

The established React/Tailwind component system should be retained. Current admin pages already provide the core navigation and CRUD surfaces.

Important workflow gaps identified during audit:

- attendance editing is not state-safe enough for production UX;
- student Import/Export controls are not wired to the hardened backend;
- some pages still use page-level `any` types;
- loading/error/empty patterns exist but should be standardized as the UI expands;
- role-specific navigation/dashboards remain future work.

## 9. Shared validation findings

The shared package provides strict date-only, pagination, attendance and student contracts. Do not weaken the shared schemas to accommodate stale test fixtures.

The repository intentionally retains some generated/shared artifacts because earlier cleanup commits were explicitly reverted. Those reverts should not be silently undone. If the generated-artifact state blocks a required test or build, address it as a deliberate separate maintenance change.

## 10. Testing findings

High-value Phase 1/2/3 E2E coverage exists and Phase 3 is green for the currently covered suites.

There is also known unit-test technical debt from the current reverted/generated-artifact state, including stale fixtures/config-loading problems. This is separate from the verified Phase 3 E2E result and should not be mixed into feature work unless it blocks the required release gate.

## 11. Documentation synchronization findings

The audit found legacy documentation drift, especially around file storage and Phase 3 verification status. The following documents have now been refreshed in GitHub:

- `phases.md`
- `docs/next-implementation-plan.md`
- `docs/phase3-attendance-progress.md`
- `docs/phase3-student-administration-progress.md`
- this audit document

The larger legacy PRD/architecture/design/rules documents still contain useful target-state material, but their older baseline dates and some current-state claims should be reconciled deliberately rather than overwritten wholesale without another requirements/architecture review.

## 12. Recommended development order after this audit

```text
1. Attendance UI correctness
2. Attendance spreadsheet import/export
3. Attendance reporting/timezone contract + tests
4. Student Import/Export UI integration
5. Teacher administration E2E + UI polish
6. Student timeline + admission/enrollment foundations
7. Class/section administration acceptance
8. Document signed-delivery/privacy audit
9. Dashboard aggregation + reporting timezone/performance
10. Phase 3 final exit verification
11. Phase 4 financial hardening
12. Exams/results
13. Homework/notices/timetable
14. Portals
15. Notifications
16. Mobile
17. SaaS/reliability
18. AI/advanced analytics
```

## 13. Engineering constraints confirmed by the audit

- code changes must be made directly on GitHub;
- Desktop Commander is for local verification, ignored files, environment-specific commands and tests;
- never weaken tenant isolation to make a feature easier;
- never bypass server authorization with frontend checks;
- preserve financial immutability and transaction safety;
- add business-critical regression tests;
- avoid unrelated refactors;
- keep documentation synchronized after meaningful changes.
