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
`COMPLETED`

### Scope
- homework and attachments
- notices
- scheduled/class notices
- timetable
- teacher timetable
- student timetable

### Verified completion — 2026-09-03

Phase 6 was implemented, regression-tested and released to production. The release includes tenant-safe Homework CRUD, private Cloudflare R2 attachments with short-lived signed delivery, tenant-scoped Notices, conflict-safe Timetable management, responsive management UI, and authenticated Chromium coverage across principal, teacher, student and parent roles.

Phase 6 remains a mandatory regression gate for subsequent work.

---

# Phase 7 — Parent / Student / Teacher Portals

### Status
`READY_FOR_VERIFICATION`

### Planning status
`PLANNING_COMPLETE` — 2026-09-03

### Implementation status
`RELEASED_TO_PRODUCTION` — 2026-09-04

### Objective
Create role-specific web experiences for teachers, students and parents using the existing tenant, ownership and RBAC foundations rather than duplicating the admin application.

### Scope
- shared role-aware portal shell;
- teacher dashboard and daily teaching workspace;
- student self-service workspace;
- parent child-focused workspace with server-authorized child switching;
- timetable, attendance, homework, notices and results consumption;
- authorized fee/document visibility where existing contracts support it;
- responsive and accessible web experience;
- role-specific loading/error/empty states;
- portal-focused API/E2E and Chromium coverage;
- distinctive, intentional frontend design using `frontend-design_skill.md` plus the existing `design.md` system.

### Explicit exclusions
Native mobile app, SMS/push/email providers, WhatsApp, SaaS billing, library/transport/inventory, payroll, speculative AI, microservices and a second UI component library remain outside Phase 7.

### Exit criteria

1. Teacher can perform core daily academic tasks within assigned scope.
2. Student can view only their own authorized academic/fee information.
3. Parent can view only explicitly linked children's authorized information.
4. Cross-tenant access is blocked for all portal roles.
5. Phase 1–6 regression gates remain green.
6. Critical portal workflows have API/E2E and authenticated Chromium coverage.
7. Desktop, tablet and mobile behavior is verified.
8. Accessibility and keyboard/focus behavior are verified for major workflows.
9. Portal visual direction is documented and consistent with the established component system.
10. Production build and post-merge production smoke pass.

### Release and regression verification — 2026-09-04

- PR #10 merged to `main` as `18fff15a1264283210c717a55beeada2d468483e`.
- Render production deployment reached `live`; `/health` returns HTTP 200.
- Vercel production deployment reached `READY` for the merge commit.
- Authenticated production Chromium verified Teacher, Student and Parent portal login/navigation and representative major workflows.
- Teacher management `/exams` access correctly redirects to the portal dashboard.
- After the authentication rate-limit window cleared, the live Phase 1–6 regression gates were rerun sequentially without changing production security configuration:
  - Phase 1: 8/8 PASS.
  - Phase 2: PASS; documents 7 PASS + 2 fixture-dependent skips, payments 5/5 PASS, audit 3/3 PASS, roles 2/2 PASS.
  - Phase 3: PASS; attendance 4/4, bulk 1/1, students 1/1, student-bulk 1/1, teachers 1/1, attendance-report 1/1, dashboard 1/1.
  - Phase 4: process PASS; 1 PASS + 2 fixture-dependent skips.
  - Phase 5: process PASS; 1 PASS + 1 fixture-dependent skip.
  - Phase 6: process PASS; 5 PASS + 5 fixture-dependent UI skips.
- The earlier `AUTH_RATE_LIMIT_EXCEEDED` incident was not bypassed; the production auth limiter remained unchanged.
- MongoDB Atlas inspection confirms the current Phase 7 parent fixture has one student in the fixture school, so true multi-child switching cannot be demonstrated without a suitable multi-child fixture.
- Remaining responsive/accessibility production acceptance must still be explicitly completed before changing this phase to `COMPLETED`.

See `docs/phase7-verification-2026-09-04.md` for the detailed evidence and remaining gates.

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
1. Phase 7 — Parent/Student/Teacher portals
2. Notifications
3. Mobile
4. SaaS administration/billing
5. Reliability/scale
6. AI/advanced analytics
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
