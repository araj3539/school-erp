# School ERP — Next Implementation Plan

Updated: 2026-09-02
Repository baseline: `main` after Phase 4 financial hardening implementation

## Current verified state

- Phase 1 Production Security and Multi-Tenancy: `COMPLETED` and retained as a regression gate.
- Phase 2 Core Administration security/ownership exit gate: `COMPLETED` and retained as a regression gate.
- Phase 3 Attendance and Administration: `COMPLETED`; attendance, bulk attendance, student search/bulk, teacher administration, attendance-report and dashboard acceptance suites are green.
- Phase 4 Fees and Financial Core: `COMPLETED` for implementation; focused financial regression coverage and the available deployed reconciliation/receipt acceptance checks are green. Full populated-payment reversal acceptance remains an environment-fixture verification task, not an implementation blocker.
- Client and server production builds pass on the current baseline.

## Phase 4 financial hardening — completed

- payment persistence rejects zero and negative ledger amounts (`min: 0.01`);
- payment collection is tenant-scoped and transaction-backed;
- idempotency replay distinguishes an exact replay from reuse of a key for different payment data, including the unique-index race path;
- idempotency and transaction IDs remain tenant-scoped and uniquely guarded;
- payment records remain immutable and corrections use reversal/refund records;
- reversal/refund amounts are positive and bounded by the original payment and cumulative prior reversals;
- reversal/refund fee balance and status updates are transaction-backed;
- reversal/refund audit events capture the actual before/after fee state;
- reconciliation validates date ranges and keeps period collections separate from lifetime ledger integrity;
- reconciliation end timestamps are handled as inclusive boundaries through an exclusive upper bound;
- receipts use tenant school name, address, phone and email rather than placeholder branding;
- receipt download filenames are sanitized before being placed in `Content-Disposition`;
- focused tests cover payment persistence guards, reversal boundary math, reconciliation boundaries, receipt branding and filename safety;
- Phase 4 acceptance coverage exists for receipt PDF response shape, reconciliation separation and over-reversal protection, with fixture-dependent tests skipped when no payment exists rather than mutating production data.

## Verification record

```text
Shared build:             PASS
Server build:             PASS
Client build:             PASS
Focused financial tests:  13/13 PASS
Deployed reconciliation:  PASS
Receipt acceptance:       PASS when populated payment fixture was available; later run skipped with no payment fixture
Reversal acceptance:      fixture-dependent; no production mutation performed
```

The deployed acceptance environment currently does not provide a populated payment fixture consistently enough to claim a destructive/controlled reversal workflow was executed against real data. This is explicitly recorded as fixture availability rather than masked as a passing test.

## Next delivery

Phase 5 — Exams and Academic Results:

1. inspect existing exam/result models, routes, validators and UI;
2. define tenant/RBAC ownership boundaries before implementation;
3. implement exam setup and marks-entry foundations;
4. add correction/publishing auditability;
5. add focused unit/API/E2E regression coverage;
6. preserve Phase 1–4 regression gates.

## Verification rule

Every production-affecting implementation must:

1. preserve tenant isolation and RBAC;
2. add business-critical tests;
3. pass relevant builds and tests;
4. pass Phase 1/Phase 2 security gates;
5. verify deployed behavior when the change is deployment-sensitive;
6. update affected living documentation.
