# School ERP — Development Phases

> **Purpose:** This is the delivery roadmap. Work should proceed in dependency order. Do not skip security/tenant foundations just because a visible feature is more attractive.

---

## Phase 0 — Foundation and Repository Hygiene

### Goal
Make the current codebase predictable and safe to extend.

### Exit criteria
- clean install works
- build works
- tests run
- lint runs
- secrets are excluded
- documentation exists

---

# Phase 1 — Production Security and Multi-Tenancy

### Status
`COMPLETED`

### Verified exit result — 2026-08-22
- tenant-owned endpoint and query audit completed
- role/permission audit completed
- student/teacher ownership checks completed
- explicit Parent ↔ Student relationship implemented
- document/recovery authorization completed
- AuditLog isolation completed
- session/refresh-token verification completed
- live cross-tenant and role/ownership Playwright gate passed
- Render deployment verification completed

### Live evidence
```text
8 passed
Phase 1 Playwright exit code: 0
```

Phase 1 remains a regression gate for later phases.

---

# Phase 2 — Core Administration MVP

### Status
`COMPLETED`

### Verified exit result — 2026-08-25

The Phase 2 consolidated live gate passed every suite:

```text
PASS     phase1       8/8
PASS     documents    7/7
PASS     payments     5/5
PASS     audit        3/3
PASS     roles        2/2
```

### Completed security/admin deliverables
- tenant-scoped school settings read/write endpoints with validation and audit snapshots
- Academic Year administration with tenant ownership and current-year synchronization
- explicit Parent ↔ Student ownership through `Student.parentIds`
- Student/Teacher/Class/Subject relationship ownership validation
- fee/payment ownership for Students and linked Parents
- payment/receipt tenant and ownership boundaries
- AuditLog tenant isolation
- Principal role-management hardening
- document/recovery authorization across role and tenant boundaries
- Phase 1 + Phase 2 live E2E regression gates

### Remaining Core Administration backlog
These are feature-completion items and do not reopen the completed security exit gate:
- search and filters
- consistent pagination
- bulk import/export workflows
- student detail timeline
- admission workflow foundations
- school branding in generated documents/reports

See `docs/phase2-security-audit.md` for the exit evidence and `docs/next-implementation-plan.md` for the next sequence.

---

# Phase 3 — Attendance

### Status
`IN_PROGRESS`

### Current focus
Attendance correctness and correction workflow.

### Production requirements
- tenant scope
- academic-year awareness
- duplicate-date protection
- correction audit
- bulk operations
- timezone-safe date handling
- teacher assignment boundaries
- monthly/history/report correctness

### Exit criteria
Teacher can mark attendance and authorized staff can audit/correct it safely.

---

# Phase 4 — Fees and Financial Core

### Status
`IN_PROGRESS`

### Modules
- fee structures
- fee generation
- payment collection
- receipts
- collection reports
- immutable ledger
- reversal/refund workflow
- reconciliation

### Exit criteria
A school can operate its complete fee collection process safely.

---

# Phase 5 — Exams and Academic Results

### Modules
- exams
- marks entry
- grade rules
- report cards
- publishing
- correction audit

### Exit criteria
Teacher can enter marks and authorized users can publish results.

---

# Phase 6 — Homework, Notices and Timetable

### Modules
- homework
- attachments
- notices
- scheduled/class notices
- timetable
- teacher timetable
- student timetable

### Exit criteria
Teachers can communicate academic work and schedules.

---

# Phase 7 — Parent/Student/Teacher Portals

Create role-specific dashboards using the existing ownership rules.

### Exit criteria
Users can access only their own/assigned records.

---

# Phase 8 — Mobile App

Recommended direction: React Native using shared API contracts and schemas.

---

# Phase 9 — Notifications

Architecture:

```text
Event -> NotificationService -> Push / SMS / Email
```

Provider failures must not break core ERP workflows.

---

# Phase 10 — Library, Transport, Inventory and Staff

Add only after core ERP workflows are stable.

---

# Phase 11 — Online Payments

Required: order creation, webhook verification, idempotency, reconciliation, refunds and receipts.

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

## Release Gates

### Alpha
Core modules function locally.

### Private Beta
One real school uses the system with supervision.

### Production v1
Security + backups + tenant isolation + financial correctness + monitoring.

### SaaS v1
Multiple schools with automated onboarding and billing.

---

## Current Implementation Order

```text
1. Phase 3 attendance correction/acceptance
2. Core administration search/filter/pagination + bulk workflows
3. Sensitive document private/authenticated delivery
4. Dashboard aggregation + timezone correctness
5. Phase 4 financial hardening and reports
6. Exams/results
7. Homework/notices/timetable
8. Parent/Student/Teacher portals
9. Notifications
10. Mobile
11. SaaS administration
12. Reliability/scale
13. AI/advanced analytics
```

Do not prioritize AI, WhatsApp, GPS or large mobile work before the core ERP is correct.

---

## Documentation Lifecycle & Phase Governance

Phase status must reflect verified implementation, not intention.

### Status states
- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `READY_FOR_VERIFICATION`
- `COMPLETED`
- `DEFERRED`

### Phase completion protocol
1. Verify exit criteria against the repository and deployed system.
2. Record deliverables, deviations and tests.
3. Move remaining work into the next appropriate backlog.
4. Update `memory.md` and relevant design/architecture/rules documentation.
5. Add a changelog entry.

### Changelog

| Version | Date | Change | Verified By |
|---|---|---|---|
| 1.4.0 | 2026-08-25 | Phase 2 consolidated live exit gate passed: 8/8 + 7/7 + 5/5 + 3/3 + 2/2; Phase 3 became the active implementation phase. | AI-assisted repository implementation review |
| 1.3.0 | 2026-08-22 | Phase 1 exit gate passed against deployed Render API; Phase 2 became active. | AI-assisted repository implementation review |
| 1.2.0 | 2026-08-18 | Phase 1 security hardening and remaining acceptance work recorded. | AI-assisted repository implementation review |
| 1.1.0 | 2026-08-11 | Added phase-state model, completion protocol and verification rules. | AI-assisted repository review |
| 1.0.0 | 2026-08-11 | Initial development roadmap. | AI-assisted repository review |
