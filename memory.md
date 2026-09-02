# School ERP — AI Project Memory

> Compact operational memory for coding agents. Repository implementation and verified tests are authoritative; this file summarizes the current state.

**Last verified:** 2026-09-02
**Repository line:** current `main` after Phase 3 student bulk export fix and documentation audit
**Overall state:** Phase 1 complete, Phase 2 security/ownership exit gate complete, Phase 3 in progress

---

## 1. Project snapshot

School ERP is a multi-tenant school administration platform intended to become an industry-grade SaaS.

Architecture:
- modular monolith first
- React + TypeScript frontend
- Express + TypeScript backend
- MongoDB + Mongoose
- shared Zod/constants package
- low infrastructure cost until scale justifies more infrastructure

Initial scale target: one school / roughly 500 students.
Next target: several schools / roughly 3,000 students.

---

## 2. Current stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zustand
- Axios
- React Hook Form
- Zod
- Recharts
- Lucide React

### Backend
- Node.js 22 target
- Express
- TypeScript
- Mongoose/MongoDB
- JWT + HttpOnly cookies
- bcryptjs
- Helmet
- CORS
- express-rate-limit
- cookie-parser
- Cloudflare R2 via S3-compatible SDK
- Backblaze B2 for recovery/backup
- PDFKit
- Excel read/write services
- Zod

### Testing/tooling
- Vitest
- Playwright
- Testing Library
- jsdom
- Turbo
- npm
- Docker Compose

---

## 3. Current API/domain areas

Frontend admin routes include:

```text
/login
/dashboard
/students
/students/:id
/teachers
/classes
/attendance
/fees
/reports
/settings
```

Backend route groups include:

```text
/api/v1/auth
/api/v1/students
/api/v1/teachers
/api/v1/academics
/api/v1/attendance
/api/v1/fees
/api/v1/dashboard
/api/v1/parents
/api/v1/school
/api/v1/health
```

Core models include:

```text
School
User
AcademicYear
Student
Teacher
Class
Section
Subject
Attendance
FeeStructure
Fee
Payment
AuditLog
```

---

## 4. Phase 1 — COMPLETED

Verified deployed gate on 2026-08-22:

```text
8 passed
```

Verified cross-tenant and role/ownership boundaries include:
- student own-record access
- cross-school student denial
- teacher class/tenant denial
- principal cross-school fee denial
- parent unlinked-child denial
- student teacher-only attendance denial
- principal tenant-owned access
- refresh-token replay denial

Phase 1 is a mandatory regression gate for all later work.

Security baseline includes HttpOnly auth cookies, refresh-token rotation, CSRF protections, Helmet, CORS allowlisting, rate limiting, Zod validation, RBAC, audit logging, bounded request bodies/uploads and tenant-scoped core controllers.

---

## 5. Phase 2 — COMPLETED

Verified consolidated gate on 2026-08-25:

```text
phase1       8/8
phase2 docs  7/7
a payments   5/5
audit        3/3
roles        2/2
```

Completed security/ownership foundations:
- school settings
- academic years/current-year ownership
- explicit Parent ↔ Student ownership through `Student.parentIds`
- Student/Teacher/Class/Subject relationship ownership
- fee/payment ownership
- receipt/payment tenant boundaries
- AuditLog isolation
- principal role-management hardening
- document/recovery authorization

Phase 2 security is closed; remaining administration feature work continues without reopening its security exit gate.

---

## 6. Phase 3 — IN PROGRESS

### Verified E2E state

```text
Attendance:       4 passed
Bulk attendance:  1 passed
Student search:   1 passed
Student bulk:     1 passed
Phase 3 summary:  PASS
```

### Attendance implemented
- tenant-scoped marking/querying
- teacher assigned-class boundary
- student self-only attendance
- parent linked-child-only attendance
- class/section/active-student validation
- academic-year date restriction
- strict `YYYY-MM-DD` calendar-date semantics
- duplicate student protection
- unique school/class/section/date index
- correction restricted to principal/super-admin
- correction audit with before/after data
- bounded bulk attendance: max 31 entries / 5000 student records
- duplicate bulk day rejection
- transactional bulk writes + audit events
- validated attendance list filters
- monthly report academic-year guard

### Student administration implemented
- validated student search/status/class/section/pagination contract
- escaped search input
- hardened atomic student bulk import
- duplicate admission-number detection
- row-level validation errors
- tenant-safe filtered student export
- teacher export limited to assigned classes

---

## 7. Phase 3 remaining work

### Highest priority
1. Attendance UI state/edit/save correctness.
2. Mark-vs-correct attendance UX and authorization messaging.
3. Attendance spreadsheet import/export.
4. Reporting/month/session boundary tests and explicit school reporting timezone decision.
5. Student Import/Export UI integration.
6. Teacher administration E2E and UI acceptance.

### Then
7. Student activity/timeline.
8. Class/section acceptance gaps.
9. Admission/enrollment foundations.
10. Promotion/transfer/withdrawal rules before implementing irreversible workflows.
11. Phase 3 final exit verification.

Do not mark Phase 3 complete merely because the current API/E2E gate is green.

---

## 8. Important current frontend findings

`StudentsPage.tsx` already exposes Import/Export buttons, but they are not wired to the hardened backend workflows.

`AttendancePage.tsx` has the core marking flow, but editable attendance currently mutates the object returned by React Query rather than maintaining explicit local edit state. This should be corrected before calling the attendance UI production-ready.

The established Tailwind/UI primitive system should be reused rather than replaced.

---

## 9. Storage architecture — CURRENT TRUTH

Current implementation is **Cloudflare R2**, not Cloudinary.

```text
Multer / upload buffer
        ↓
Cloudflare R2
        ↓
short-lived signed URL
```

Backups/recovery use Backblaze B2.

There is no active Cloudinary implementation under `server/src`.

Older PRD/architecture references to Cloudinary are legacy documentation and must not be used as implementation evidence.

Remaining document work:
- verify every sensitive document URL is authorized by tenant + ownership/role;
- ensure no permanent public object URL bypass exists;
- standardize short-lived signed delivery;
- maintain separate authorization for recovery operations.

---

## 10. Reporting/performance debt

Dashboard trend generation currently performs repeated database queries inside loops.

Required later:
- replace with aggregation/batched queries;
- standardize school reporting timezone;
- verify month and academic-session boundaries;
- add focused performance regression tests.

Avoid premature caching/microservices.

---

## 11. Shared schema and generated-artifact caution

Shared schemas intentionally enforce strict date-only semantics.

Do not weaken production schemas to accommodate stale fixtures.

Earlier commits that removed stale generated shared artifacts were explicitly reverted. Do not silently reintroduce those changes. If the generated-artifact state blocks a required test/build, treat that as a deliberate maintenance task.

Known unit-test technical debt may exist around stale fixtures/config-loading/generated-artifact state. It is separate from the green Phase 3 E2E acceptance result unless it blocks a required release gate.

---

## 12. Financial baseline

Payment collection/reversal workflows are tenant-scoped and transaction-safe, with immutable financial-history principles and reconciliation support.

Before Phase 4 completion, continue verifying:
- period-vs-lifetime reconciliation
- reversal/refund edge cases
- receipt correctness/branding
- ledger immutability
- idempotency and duplicate external transaction handling

---

## 13. Development order

```text
1. Attendance UI correctness
2. Attendance spreadsheet import/export
3. Attendance reporting/timezone contract + tests
4. Student Import/Export UI integration
5. Teacher administration E2E + UI polish
6. Student timeline + admission/enrollment foundations
7. Class/section administration acceptance
8. Document signed-delivery/privacy audit
9. Dashboard aggregation + reporting timezone/performance
10. Phase 3 final exit verification
11. Phase 4 financial hardening
12. Exams/results
13. Homework/notices/timetable
14. Parent/Student/Teacher portals
15. Notifications
16. Mobile
17. SaaS/reliability
18. AI/advanced analytics
```

Do not prioritize microservices, Kubernetes, GPS/WhatsApp automation, speculative AI decisioning or large mobile work before core correctness.

---

## 14. Coding workflow contract

Before coding:
- inspect `prd.md`, `architecture.md`, `rules.md`, `design.md`, `phases.md`, `memory.md`;
- inspect the actual relevant code;
- define acceptance criteria.

During coding:
- make tracked code/document changes directly on GitHub;
- preserve tenant isolation/RBAC;
- add focused tests;
- avoid unrelated refactors.

For local-only work:
- use Desktop Commander for ignored files, local `.env`, commands, builds and E2E verification;
- do not turn local-only environment changes into source-code commits unless explicitly required.

After coding:
- pull/verify locally;
- run relevant build/tests/E2E;
- verify authorization, tenant isolation and error states;
- update affected living documentation.

Memory is context, not proof; refresh it after meaningful changes.
