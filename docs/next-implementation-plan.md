# School ERP — Next Implementation Plan

Updated: 2026-09-02
Repository baseline: `main` after Phase 3 closure

## Current verified state

- Phase 1 Production Security and Multi-Tenancy: `COMPLETED` and retained as a regression gate.
- Phase 2 Core Administration security/ownership exit gate: `COMPLETED` and retained as a regression gate.
- Phase 3 Attendance and Administration: `COMPLETED`; attendance, bulk attendance, student search/bulk, teacher administration and attendance-report acceptance suites are green.
- Client and server production builds pass on the verified Phase 3 baseline.

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

First slice:
- ensure normal student and parent read responses never expose R2 storage keys or legacy public object identifiers;
- keep document metadata available to authorized UI workflows;
- require tenant/ownership authorization before generating a signed document URL;
- keep signed delivery short-lived;
- verify cross-tenant, student, parent and teacher ownership boundaries;
- verify recovery preview remains separately authorized and never exposes recovery keys;
- audit document access where appropriate without recording signed URLs or storage secrets;
- keep recovery operations separately authorized.

Exit criteria:

```text
Raw storage keys absent from normal read responses    PASS
Signed URL requires tenant/ownership authorization    PASS
Signed URL is short-lived                             PASS
Cross-tenant document access blocked                  PASS
Recovery preview does not expose recovery key        PASS
Recovery restore remains admin-only                   PASS
Focused document/privacy regression coverage          PASS
```

## Priority 2 — Reporting and dashboard performance

- batch repeated dashboard attendance/payment queries with aggregation;
- preserve the Phase 3 date-only attendance reporting contract;
- define a school-local reporting timezone before introducing timestamp-to-local-date conversion elsewhere;
- verify date boundaries;
- add focused performance regression coverage;
- progressively remove business-critical `any` without broad unrelated rewrites.

## Priority 3 — Phase 4 financial hardening

After document/privacy and reporting foundations are stable:

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
