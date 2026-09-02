# School ERP — Next Implementation Plan

Updated: 2026-09-02
Repository baseline: `main` at the current Phase 3 development line

## Current verified state

- Phase 1 Production Security and Multi-Tenancy: `COMPLETED` and retained as a regression gate.
- Phase 2 Core Administration security/ownership exit gate: `COMPLETED` and retained as a regression gate.
- Phase 3 API/E2E acceptance coverage is green for attendance, bulk attendance, student search and student bulk import/export.
- Phase 3 is **not complete** because important UI workflows, teacher administration acceptance, attendance reporting/timezone hardening and administration workflow completion remain.

## Priority 0 — Keep the verified baseline stable

Before each production-affecting slice:

1. preserve tenant isolation and RBAC;
2. add focused regression coverage;
3. keep the Phase 1 and Phase 2 gates green;
4. build shared/server/client as applicable;
5. update the living documentation from verified implementation state.

## Priority 1 — Finish Phase 3 Attendance + Administration

### 1. Attendance UI correctness
- Replace direct mutation of React Query response objects with explicit component state or mutation payload state.
- Make attendance status/remark editing deterministic and saveable.
- Distinguish new marking from correction of an existing attendance day.
- Show authorization errors and correction history clearly.

### 2. Attendance spreadsheet workflow
- Define an explicit import/export workbook contract.
- Reuse `BulkAttendanceSchema` and the hardened bulk service.
- Validate every row before mutation.
- Return actionable row-level errors.
- Preserve tenant, academic-year and teacher-assignment boundaries.
- Add import/export E2E coverage.

### 3. Attendance reporting/timezone correctness
- Verify monthly/history behavior at academic-year start/end and month boundaries.
- Decide the authoritative school reporting timezone before adding date conversion logic.
- Avoid server-local `Date` behavior for school-local reports.
- Add regression tests for the chosen rule.

### 4. Student administration UI integration
- Wire Students Import to the hardened bulk endpoint.
- Wire Students Export to current search/status/class/section filters.
- Provide progress, validation errors, success counts and download behavior.
- Add teacher search/status/pagination acceptance coverage.

### 5. Administration workflow completion
- student detail activity/timeline
- class/section administration acceptance gaps
- admission/enrollment foundations
- promotion/transfer/withdrawal rules before implementing irreversible workflows

### Phase 3 exit gate
Do not mark Phase 3 complete until:

```text
Attendance UI workflow            PASS
Attendance API/E2E                PASS
Attendance bulk                   PASS
Attendance reporting boundaries   PASS
Attendance spreadsheet workflow   PASS
Student admin UI bulk workflow    PASS
Teacher admin acceptance          PASS
Phase 1 regression                PASS
Phase 2 regression                PASS
Builds                            PASS
```

## Priority 2 — Sensitive document delivery

The implementation uses Cloudflare R2 signed URLs and Backblaze B2 recovery infrastructure, not the older Cloudinary design described in some legacy documentation.

Next document-security work:
- confirm every document URL is generated only after tenant/ownership authorization;
- eliminate any endpoint that exposes raw permanent object URLs;
- use short-lived signed delivery consistently;
- audit sensitive document access where required;
- keep recovery operations separately authorized.

## Priority 3 — Reporting and dashboard performance

- batch repeated dashboard attendance/payment queries with aggregation;
- standardize school reporting timezone;
- verify date boundaries;
- add focused performance regression coverage;
- progressively remove business-critical `any` without broad unrelated rewrites.

## Priority 4 — Financial hardening

After Phase 3 and document/reporting foundations are stable:

- collection reports and reconciliation verification;
- receipt correctness and tenant school branding;
- reversal/refund edge cases;
- immutable-ledger regression tests;
- period-vs-lifetime reconciliation correctness.

## Later delivery order

```text
Phase 4 financial hardening
-> Exams/results
-> Homework/notices/timetable
-> Parent/Student/Teacher portals
-> Notifications
-> Mobile
-> SaaS administration/billing
-> Reliability/scale
-> AI/advanced analytics
```

## Explicit non-goals for the next slices

Do not introduce microservices, Kubernetes, large mobile work, WhatsApp/GPS automation, speculative AI decisioning, or broad caching before the core ERP workflows are correct and regression-gated.

## Verification rule

Every production-affecting implementation must:

1. preserve tenant isolation and RBAC;
2. add business-critical tests;
3. pass relevant builds and tests;
4. pass Phase 1/Phase 2 regression gates;
5. verify the deployed behavior when the change is deployment-sensitive;
6. update affected living documentation.
