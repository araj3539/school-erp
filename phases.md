# School ERP — Development Phases

> **Purpose:** This is the delivery roadmap. Work should proceed in dependency order.
> Do not skip security/tenant foundations just because a visible feature is more attractive.

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

### Priority
**P0 — must happen before serious multi-school deployment**

### Verified exit result — 22 August 2026
- tenant-owned endpoint and query audit completed for core modules
- role/permission boundary audit completed
- student/teacher ownership checks completed
- explicit Parent ↔ Student relationship implemented and verified
- document/recovery authorization completed
- AuditLog tenant isolation completed
- refresh-token rotation/replay verification completed
- cross-tenant and role/ownership Playwright acceptance suite passed against deployed Render API
- Render deployment verification completed

### Live acceptance evidence
```text
Running 8 tests using 1 worker
8 passed (34.5s)
Phase 1 Playwright exit code: 0
```

Phase 1 remains a regression gate for subsequent phases.

---

# Phase 2 — Core Administration MVP

### Status
`IN_PROGRESS`

### Current focus
**School settings and administration foundation**

### Implemented in Phase 2
- tenant-scoped school settings read endpoint: `GET /api/v1/school/settings`
- principal-only school settings write endpoint: `PATCH /api/v1/school/settings`
- settings writes are validated and audited with before/after snapshots
- school settings writes cannot change `schoolId`, immutable school code, or academic year

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

### Status
`IN_PROGRESS`

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

### Status
`IN_PROGRESS`

### Current foundation
- fee structures
- fee generation
- payment collection
- receipt PDF
- daily/monthly collection
- audit logs
- immutable payment ledger and reversal/refund workflow
- financial reconciliation

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

### Exit criteria
Android production build works for parents and teachers.

---

# Phase 9 — Notifications

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

Current implementation sequence:

```text
1. Finish Phase 2 school settings and academic years
2. Finish Phase 2 users/students/teachers/classes/sections/subjects administration
3. Add admin search/filter/pagination and bulk workflows
4. Complete Phase 3 attendance correction/acceptance gaps
5. Finish Phase 4 financial hardening and reports
6. Add exams/results
7. Add notifications
8. Add portals
9. Add mobile
10. Add SaaS administration
```

Do not start with AI, WhatsApp, GPS or a large mobile app before the core tenant/security/financial foundation is reliable.

---

## Documentation Lifecycle & Phase Governance

This roadmap is a **living delivery record**. Phase status must reflect verified implementation, not intention.

### Status Metadata

- **Document version:** 1.3.0
- **Lifecycle status:** Living / actively maintained
- **Baseline verified:** 11 August 2026
- **Last repository review:** 22 August 2026
- **Current state:** Phase 1 `COMPLETED`; Phase 2 `IN_PROGRESS`
- **Next mandatory review:** At every phase transition, scope change, or major blocker discovery

### Required Phase States

Use only these states:
- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `READY_FOR_VERIFICATION`
- `COMPLETED`
- `DEFERRED`

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
| 1.3.0 | 2026-08-22 | Phase 1 exit gate passed against deployed Render API (8/8); transitioned Phase 2 to active and started school settings administration. | AI-assisted repository implementation review |
| 1.2.0 | 2026-08-18 | Marked Phase 1 in progress; recorded verified tenant hardening, attendance progress, and transactional financial work; added remaining acceptance work. | AI-assisted repository implementation review |
| 1.1.0 | 2026-08-11 | Added phase state model, completion protocol, verification, and living-roadmap rules. | AI-assisted repository review |
| 1.0.0 | 2026-08-11 | Initial development roadmap. | AI-assisted repository review |
