# School ERP — Next Implementation Plan

Updated: 2026-08-25

## Current state

Phase 1 Production Security and Multi-Tenancy: `COMPLETED`.

Phase 2 Core Administration security/ownership exit gate: `COMPLETED`.

Next work should preserve both acceptance gates and move forward in dependency order.

## Priority 1 — Attendance completion

Close the remaining attendance production gaps before expanding into portals or AI:

- correction workflow with explicit authorization
- correction audit events with before/after values
- academic-year-aware attendance queries
- duplicate-date protection
- tenant-safe bulk attendance operations
- timezone-safe date handling using school configuration
- monthly/history/report verification
- teacher assignment boundaries for attendance operations

Acceptance goal: a teacher can mark attendance, authorized staff can correct it, and every correction is auditable and tenant-safe.

## Priority 2 — Core Administration polish

Complete the remaining Phase 2 administration backlog without reopening its security exit gate:

- tenant-safe search and filters for users/students/teachers/classes
- consistent pagination contracts
- bulk import validation and actionable error reporting
- bulk export with tenant-safe field selection
- student detail timeline
- admission workflow foundations
- school branding propagated into PDFs/reports

## Priority 3 — Sensitive document privacy

Replace permanent document URLs with controlled authenticated delivery.

Target flow:

```text
authenticated request
  -> tenant + ownership authorization
  -> short-lived/private document delivery
  -> audit event where required
```

Do not expose sensitive student/teacher documents through permanent public URLs.

## Priority 4 — Reporting correctness and performance

- batch dashboard chart queries with aggregation instead of repeated loops
- standardize school/reporting timezone
- verify date boundaries around month/session transitions
- add focused performance regression checks before scaling the dashboard

## Priority 5 — Financial hardening

After attendance/admin foundations are stable:

- collection reports and reconciliation verification
- receipt correctness and school branding
- reversal/refund edge cases
- immutable-ledger regression tests
- period-vs-lifetime reconciliation correctness

## Later phases

Only after the core data model and workflows remain stable:

```text
Exams/results
-> Homework/notices/timetable
-> Parent/Student/Teacher portals
-> Notifications
-> Mobile
-> SaaS administration/billing
-> Reliability/scale
-> AI/advanced analytics
```

## Non-goals for the next slice

Do not introduce microservices, Kubernetes, large mobile work, WhatsApp/GPS automation, or AI decisioning while core attendance, administration, document privacy, reporting and financial correctness are still being hardened.

## Verification rule

Every production-affecting implementation must:

1. preserve tenant isolation and RBAC;
2. add business-critical tests;
3. pass shared/server builds;
4. pass the relevant Phase 1/Phase 2 regression gate;
5. update documentation when behavior or architecture changes.