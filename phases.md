# School ERP — Development Phases

> **Purpose:** Delivery roadmap and phase governance. Status must reflect verified implementation, not intention.

---

## Phase 0 — Foundation and Repository Hygiene

### Status
`COMPLETED`

The repository has an established monorepo structure, shared validation, builds, tests, deployment configuration and living documentation. Remaining test/dependency cleanup is tracked as technical debt rather than treated as a feature phase.

---

# Phase 1 — Production Security and Multi-Tenancy

### Status
`COMPLETED`

Phase 1 remains a mandatory regression gate.

---

# Phase 2 — Core Administration Security/Ownership

### Status
`COMPLETED`

Phase 2 remains a mandatory regression gate.

---

# Phase 3 — Attendance and Core Administration Completion

### Status
`COMPLETED`

Completed implementation includes tenant-safe attendance, academic-year-aware calendar dates, duplicate-day protection, teacher class boundaries, audited correction workflow, transactional bulk attendance, spreadsheet import/export, reporting boundaries, student/teacher administration, and dashboard acceptance.

Phase 3 remains a mandatory regression gate for subsequent work.

---

# Phase 4 — Fees and Financial Core

### Status
`COMPLETED`

### Implementation completion — 2026-09-02

Completed financial hardening includes:
- tenant-scoped fee/payment collection with transaction-backed balance updates;
- immutable payment ledger rules and reversal/refund workflow;
- positive persisted payment and reversal amounts;
- idempotency replay/collision handling and tenant-scoped transaction uniqueness;
- cumulative reversal bounds preventing over-refund/reversal;
- accurate before/after fee-state audit events for reversals/refunds;
- reconciliation date-range validation and inclusive end-bound handling;
- separate period collection totals versus lifetime ledger integrity totals;
- receipt generation bound to the tenant school's configured name, address, phone and email instead of placeholder branding;
- sanitized receipt download filenames;
- focused financial tests for persistence safeguards, reversal partial/full boundary math, reconciliation boundaries, receipt branding and filename safety;
- non-destructive Phase 4 E2E coverage for receipt PDF response shape, reconciliation separation and over-reversal rejection when a populated payment exists.

### Verified implementation result

```text
Shared build:             PASS
Server build:             PASS
Client build:             PASS
Focused financial tests:  PASS
Deployed reconciliation:  PASS
Receipt/reversal fixture: no populated payment fixture available; tests safely skipped rather than mutating production data
```

The implementation is complete and production-safe. Fixture-dependent destructive/controlled reversal acceptance is intentionally not represented as a passing deployed test when the environment has no suitable payment fixture.

### Exit criteria
A school can operate its fee collection process safely, issue correctly branded receipts, reverse/refund payments within ledger bounds, and reconcile period reporting against lifetime ledger state.

---

# Phase 5 — Exams and Academic Results

### Status
`COMPLETED`

### Scope
- exams
- marks entry
- grade rules
- report cards
- publishing
- correction audit

### Exit criteria
Teacher can enter marks and authorized users can publish results safely.

---

# Phase 6 — Homework, Notices and Timetable

### Status
`IN_PROGRESS`

### Scope
- homework and attachments
- notices
- scheduled/class notices
- timetable
- teacher timetable
- student timetable

### Current progress
Homework vertical slice is implemented and build-verified. Notices and timetable remain to be implemented and regression-tested.

---

# Phase 7 — Parent/Student/Teacher Portals

Create role-specific experiences using existing tenant and ownership rules.

### Exit criteria
Users can access only their own or explicitly assigned records.

---

# Phase 8 — Mobile App

Recommended direction: React Native using shared API contracts and schemas.

---

# Phase 9 — Notifications

```text
Business event -> NotificationService -> Push / SMS / Email
```

Provider failures must not break core ERP workflows.

---

# Phase 10 — Library, Transport, Inventory and Staff

Add only after core ERP workflows are stable and requirements are defined.

---

# Phase 11 — Online Payments

Order creation, webhook verification, idempotency, reconciliation, refunds and receipts.

Never trust client-side payment success state.

---

# Phase 12 — SaaS Platform

Tenant lifecycle, subscriptions, billing, module entitlements, usage and audited support operations.

---

# Phase 13 — Reliability and Scale

Backups, restore tests, monitoring, error tracking, structured logs, queues, workers, alerting and database performance work.

---

# Phase 14 — AI and Advanced Analytics

Only after core data quality is strong. AI must never make authoritative financial or academic decisions without human approval.

---

## Current Implementation Order

```text
1. Phase 6 — Homework/notices/timetable
2. Parent/Student/Teacher portals
3. Notifications
4. Mobile
5. SaaS administration/billing
6. Reliability/scale
7. AI/advanced analytics
```

Do not prioritize microservices, Kubernetes, GPS/WhatsApp automation, speculative AI decisioning or broad caching before the core ERP is correct and regression-gated.

---

## Release Gates

### Alpha
Core modules function locally.

### Private Beta
One real school uses the system with supervision.

### Production v1
Security + backups + tenant isolation + financial correctness + document privacy + monitoring.

### SaaS v1
Multiple schools with automated onboarding and billing.

---

## Documentation Lifecycle

At every phase or material change:
1. verify the repository and deployed behavior where applicable;
2. record completed and remaining work;
3. update affected living documents;
4. keep Phase 1/2 security gates as regression gates;
5. only change a phase to `COMPLETED` after its exit criteria are verified.

### Status states
- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `READY_FOR_VERIFICATION`
- `COMPLETED`
- `DEFERRED`
