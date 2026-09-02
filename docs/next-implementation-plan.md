# School ERP — Next Implementation Plan

Updated: 2026-09-02
Repository baseline: `main` after Phase 3 closure and Phase 4 financial hardening

## Current verified state

- Phase 1 Production Security and Multi-Tenancy: `COMPLETED` and retained as a regression gate.
- Phase 2 Core Administration security/ownership exit gate: `COMPLETED`; the last known successful document/recovery verification was 7/7, while the latest local rerun was blocked by a transient deployed-login 502 on the first test and did not exercise the populated-document cases.
- Phase 3 Attendance and Administration: `COMPLETED`; attendance, bulk attendance, student search/bulk, teacher administration and attendance-report acceptance suites are green.
- Phase 4 financial implementation: `READY_FOR_VERIFICATION`; collection/reversal/reconciliation hardening and receipt branding are implemented, with focused regression coverage. The deployed acceptance suite verified reconciliation, while receipt/reversal acceptance could not be exercised because the configured school fixture currently has no payment record; a transient login 502 also interrupted one retry.
- Client and server production builds pass on the current `main` baseline.

## Priority 0 — Keep the verified baseline stable

Before each production-affecting slice:

1. preserve tenant isolation and RBAC;
2. add focused regression coverage;
3. keep the Phase 1 and Phase 2 gates green;
4. build shared/server/client as applicable;
5. verify deployment-sensitive behavior;
6. update the living documentation from verified implementation state.

## Priority 1 — Sensitive document delivery and privacy audit

The implementation uses Cloudflare R2 signed URLs and Backblaze B2 recovery infrastructure, not the older Cloudinary design described in some legacy documentation.

Completed implementation slice:
- normal student and parent read responses no longer expose R2 storage keys or legacy public object identifiers;
- document upload responses expose only safe metadata;
- recovery-history responses expose only safe recovery metadata and never recovery/storage keys;
- signed document delivery remains tenant/ownership authorized and 600 seconds short-lived;
- populated-document acceptance coverage is present in the Phase 2 E2E suite and activates when `E2E_SCHOOL_A_DOCUMENT_ID` points to a real fixture document.

Remaining verification:
- provision or identify a non-destructive populated-document fixture for the deployed acceptance run;
- verify authorized student/parent delivery against that fixture;
- verify cross-tenant denial against the populated document;
- add durable document-view audit logging only if product requirements call for it, without recording signed URLs or storage secrets.

## Priority 2 — Reporting and dashboard performance

Status: **IN PROGRESS**

Completed first performance slice:
- dashboard attendance trend now uses one batched aggregation instead of one database query per day;
- dashboard payment collection trend now uses one bounded payment query and in-memory date bucketing instead of one database query per day;
- Phase 3 date-only attendance semantics are preserved by using UTC calendar-day boundaries for attendance trend data;
- payment bucketing retains the existing server-local timestamp behavior until a school-local reporting timezone is explicitly defined;
- focused dashboard E2E coverage verifies the 7-day/30-day series bounds, date-only formatting, consecutive daily boundaries, and numeric rate/collection constraints;
- the dashboard suite is included in the Phase 3 regression gate.

Next:
- define a school-local reporting timezone before expanding timestamp-to-local-date reporting behavior;
- progressively remove business-critical `any` without broad unrelated rewrites.

## Priority 3 — Phase 4 financial hardening

Status: **READY_FOR_VERIFICATION**

Completed implementation slices:
- payment persistence now rejects zero and negative ledger amounts (`min: 0.01`);
- idempotency-key collision handling now distinguishes an exact replay from reuse of the same key for different payment data, including the concurrent unique-index race path;
- existing tenant-scoped idempotency and transaction-ID uniqueness guards are retained;
- payment and reversal operations remain transaction-backed and tenant-scoped;
- reversal/refund amounts remain bounded by the original payment and cumulative reversals are checked before creating another reversal;
- reconciliation now rejects an end date earlier than its start date;
- reconciliation date filters treat the supplied end timestamp as an inclusive boundary by using an exclusive upper bound one millisecond after the supplied value;
- persisted reversal/refund amounts now reject zero and negative values (`min: 0.01`);
- receipts now use the tenant school's configured name, address, phone and email instead of placeholder branding;
- focused financial regression coverage now covers payment persistence guards, reversal partial/full boundary math and receipt branding input;
- a non-destructive Phase 4 E2E suite now covers PDF response shape, period-vs-lifetime reconciliation response separation and over-reversal rejection when a populated payment fixture is available.

Verification completed:
- shared build: PASS;
- server build: PASS;
- client build: PASS;
- focused financial tests: 11/11 PASS;
- deployed reconciliation acceptance: PASS;
- deployed receipt/reversal acceptance: not exercised because the configured school fixture currently has no payment record; one retry also encountered a transient deployed-login 502.

Remaining Phase 4 exit verification:
- run the receipt acceptance against a populated payment fixture and verify the generated PDF visually/semantically contains the configured school identity;
- run non-destructive over-reversal acceptance against a populated payment fixture;
- run a controlled partial-then-full reversal acceptance path in an isolated fixture/database, verifying fee balance/status and audit events;
- run immutable-ledger regression coverage against actual persistence operations;
- verify period-vs-lifetime reconciliation with known historical and in-period payment/reversal fixtures, including the inclusive end boundary.

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
4. pass Phase 1/Phase 2 security gates;
5. verify the deployed behavior when the change is deployment-sensitive;
6. update affected living documentation.
