# School ERP — Development Phases

> **Purpose:** This is the delivery roadmap. Work should proceed in dependency order.
> Do not skip security/tenant foundations just because a visible feature is more attractive.

---

## Phase 0 — Foundation and Repository Hygiene

### Goal
Make the current codebase predictable and safe to extend.

### Tasks
- clean repository/Git state
- correct `.gitignore`
- environment example
- consistent npm workspace/monorepo strategy
- standard TypeScript configuration
- lint/format scripts
- test scripts
- CI pipeline
- health endpoint
- error handling baseline
- request logging
- documentation files

### Exit criteria
- clean install works
- build works
- tests run
- lint runs
- secrets are excluded
- documentation exists

---

# Phase 1 — Production Security and Multi-Tenancy

### Priority
**P0 — must happen before serious multi-school deployment**

### Current foundation
Already present:
- `schoolId` fields
- JWT payload includes schoolId
- auth middleware
- RBAC
- audit model
- rate limiting
- Helmet
- Zod validation

### Required work
- enforce `schoolId` on every tenant-owned query
- fix unscoped reads/updates/deletes
- fix login tenant-selection behavior
- centralize tenant context
- add tenant-aware service/repository patterns
- add cross-tenant authorization tests
- eliminate permission duplication
- review client auth persistence
- refresh-token rotation/revocation
- security headers/CORS review
- brute-force protection
- production cookie configuration
- secret management

### Exit criteria
Automated tests prove:

```text
School A -> own data: allowed
School A -> School B data: denied
```

for all core modules.

---

# Phase 2 — Core Administration MVP

### Modules
- school settings
- academic years
- users
- students
- teachers
- classes
- sections
- subjects
- documents
- dashboard

### Improvements
- proper search
- filters
- pagination
- bulk import validation
- bulk export
- student detail timeline
- admission workflow
- school branding

### Exit criteria
A school can complete its basic setup and maintain its student/teacher database.

---

# Phase 3 — Attendance

### Modules
- student attendance
- class/section attendance
- attendance history
- monthly reports
- correction workflow
- teacher attendance later

### Production requirements
- tenant scope
- academic-year awareness where appropriate
- duplicate-date protection
- correction audit
- bulk operations
- timezone-safe date handling

### Exit criteria
Teacher can mark attendance and authorized staff can audit/correct it.

---

# Phase 4 — Fees and Financial Core

### Current foundation
- fee structures
- fee generation
- payment collection
- receipt PDF
- daily/monthly collection
- audit logs

### Required production upgrades
- transaction-safe payment collection
- immutable payment records
- payment reversal/refund
- concession/discount approvals
- installment plans
- due-date logic
- overdue calculation
- receipt numbering
- financial reports
- reconciliation
- cash/UPI/bank/cheque tracking

### Exit criteria
A school can operate its complete fee collection process safely.

---

# Phase 5 — Exams and Academic Results

### Modules
- exam definitions
- subjects
- marks entry
- grade rules
- report cards
- rank/position if school policy requires
- result publishing
- result correction audit

### Exit criteria
Teacher can enter marks and authorized users can publish results.

---

# Phase 6 — Homework, Notices and Timetable

### Modules
- homework
- attachments
- notices
- scheduled notices
- class-specific notices
- timetable
- teacher timetable
- student timetable

### Exit criteria
Teachers can communicate academic work and schedules.

---

# Phase 7 — Parent/Student/Teacher Portals

### Web
Create role-specific dashboards.

Parent:
- child selector
- attendance
- fees
- homework
- results
- notices

Teacher:
- assigned classes
- attendance
- homework
- marks
- timetable

Student:
- own records

### Exit criteria
Users can access only their own/assigned records.

---

# Phase 8 — Mobile App

### Recommended direction
React Native, sharing API contracts and shared business schemas.

### Apps
Start with one application supporting role-based experiences rather than three separate codebases.

Features:
- login
- push notifications
- attendance
- homework
- fees
- results
- notices
- timetable
- profile

### Exit criteria
Android production build works for parents and teachers.

---

# Phase 9 — Notifications

### Push
Firebase Cloud Messaging.

Use for:
- homework
- attendance
- notices
- fee status
- results

### SMS
Use paid SMS provider.

Use primarily for:
- fee due reminders
- urgent notices

### Email
Use for:
- reports
- receipts
- administrative communication

### Architecture
Use a notification service and queue:

```text
Event
  -> NotificationService
      -> Push
      -> SMS
      -> Email
```

### Exit criteria
Provider failures do not break core ERP operations.

---

# Phase 10 — Library, Transport, Inventory and Staff

Modules:
- library books/issues/fines
- transport routes
- vehicles
- drivers
- inventory
- staff
- leave
- payroll
- expenses

These should be added only after core ERP workflows are stable.

---

# Phase 11 — Online Payments

Integrate a provider such as Razorpay/other appropriate Indian gateway.

Required:
- payment order creation
- webhook verification
- idempotency
- reconciliation
- failed payments
- refunds
- receipts

Never trust client-side "payment successful" state.

---

# Phase 12 — SaaS Platform

### Tenant management
- create school
- deactivate school
- subscription plan
- module entitlements
- usage
- admin support

### Billing
- plans
- invoices
- subscriptions
- payment status
- grace periods

### Platform isolation
- strict tenant access
- platform audit
- support impersonation only with explicit audited mechanism

---

# Phase 13 — Reliability and Scale

Add:
- Redis
- background workers
- job queues
- scheduled jobs
- automated backups
- restore tests
- monitoring
- error tracking
- structured logs
- alerting
- rate-limit strategy
- CDN
- object storage
- database performance monitoring

---

# Phase 14 — AI and Advanced Analytics

Only after core data quality is strong.

Potential features:
- AI report-card remarks
- natural-language school assistant
- attendance risk detection
- fee-risk analytics
- performance summaries
- timetable assistance
- administrative document generation

AI must never make authoritative financial/academic decisions without human approval.

---

## Release Gates

### Alpha
Core modules function locally.

### Private Beta
One real school uses it with supervision.

### Production v1
Security + backups + tenant isolation + financial correctness + monitoring.

### SaaS v1
Multiple schools with automated tenant onboarding and billing.

---

## Recommended Immediate Order

If continuing from the uploaded codebase today:

```text
1. Fix multi-tenant data isolation
2. Fix auth/session architecture
3. Consolidate validation/permissions
4. Add integration + tenant security tests
5. Harden student/teacher/class modules
6. Harden attendance
7. Harden fees/payments
8. Complete reports/PDFs
9. Add exams/results
10. Add notifications
11. Add portals
12. Add mobile
13. Add SaaS administration
```

Do not start with AI, WhatsApp, GPS or a large mobile app before the core tenant/security/financial foundation is reliable.

---

## Documentation Lifecycle & Phase Governance

This roadmap is a **living delivery record**. Phase status must reflect verified implementation, not intention.

### Status Metadata

- **Document version:** 1.1.0
- **Lifecycle status:** Living / actively maintained
- **Baseline verified:** 11 August 2026
- **Current state:** Early development; phase completion must be earned through exit criteria
- **Next mandatory review:** At every phase transition, scope change, or major blocker discovery

### Required Phase States

Use only these states:
- `NOT_STARTED` — no meaningful implementation work completed
- `IN_PROGRESS` — work is actively being implemented
- `BLOCKED` — progress depends on a known unresolved blocker
- `READY_FOR_VERIFICATION` — implementation is believed complete but acceptance checks remain
- `COMPLETED` — all exit criteria verified
- `DEFERRED` — intentionally moved out of the current roadmap

Do not mark a phase `COMPLETED` because the code compiles or because most tasks are done. All critical exit criteria must pass.

### Phase Completion Protocol

When a phase is completed:
1. Verify its exit criteria against the actual repository.
2. Record completed deliverables and any deviations.
3. Record tests/validation performed.
4. Move remaining work into the next appropriate phase.
5. Update `memory.md` with the new current state.
6. Update `prd.md`, `architecture.md`, `design.md`, and `rules.md` when the phase changed any of their subject matter.
7. Add a changelog entry and update the document version if the roadmap materially changed.

### No Retroactive Fiction

If a phase was partially implemented, keep it `IN_PROGRESS` or split the remaining work. Never rewrite history to make the roadmap appear cleaner than the actual development record.

### AI Planning Rule

AI agents should select work from the current active phase unless the user explicitly requests otherwise. Before starting a task, check dependencies and phase exit criteria. If the requested task violates the dependency order, explain the dependency and either address the prerequisite or obtain an explicit decision to defer it.

### Changelog

| Version | Date | Change | Verified By |
|---|---|---|---|
| 1.1.0 | 2026-08-11 | Added phase state model, completion protocol, verification, and living-roadmap rules. | AI-assisted repository review |
| 1.0.0 | 2026-08-11 | Initial development roadmap. | AI-assisted repository review |

