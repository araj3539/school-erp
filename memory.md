# School ERP — AI Project Memory

> **Purpose:** Compact operational memory for AI coding agents. Verify important claims against the repository before relying on them.

**Last verified:** 2026-09-01
**Repository status:** actively developed; Phase 1 security baseline completed; Phase 2 Core Administration MVP completed; Phase 3 Attendance in progress.

---

## 1. Project Snapshot

School ERP intended to become an industry-grade multi-tenant SaaS.

Current target:
- initially one school / ~500 students
- later 3–4 schools / ~3,000 students
- eventually many schools

Architecture philosophy:
- modular monolith first
- MongoDB + Mongoose
- low infrastructure cost without sacrificing security/correctness
- scale infrastructure only when justified

---

## 2. Current Stack

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
- Node.js
- Express
- TypeScript
- Mongoose
- MongoDB
- JWT
- bcryptjs
- Helmet
- CORS
- express-rate-limit
- cookie-parser
- Cloudinary
- PDFKit
- read-excel-file
- write-excel-file
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

## 3. Implemented Functional Areas

Frontend routes:
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

Backend groups:
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

Core models:
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

## 4. Phase 1 Security Baseline — COMPLETED 22 Aug 2026

The deployed acceptance gate passed all 8 checks against Render:
```text
8 passed (34.5s)
Phase 1 Playwright exit code: 0
```

Verified:
- School A student can access own record
- School A cannot access School B student data
- teacher cross-tenant/class ownership is denied
- principal cross-tenant fee access is denied
- parent access to an unlinked child is denied
- student access to teacher-only attendance management is denied
- principal can access tenant-owned student data
- refresh-token replay after rotation is denied

Phase 1 is now a regression gate for future changes.

Security implemented and verified includes:
- JWT access + refresh tokens
- HttpOnly auth cookies
- production `SameSite=None` cookies for separate SPA/API hosting
- Origin / Fetch-Metadata CSRF protection
- Helmet
- strict CORS allowlist
- API rate limiting + login rate limiting
- Zod validation
- RBAC
- audit logging
- bounded JSON / URL-encoded request bodies
- bounded multipart uploads
- MIME restrictions for uploads
- escaped Mongo regex search input
- no browser localStorage access-token persistence
- tenant-scoped core controllers and reporting
- explicit Parent ↔ Student ownership through `Student.parentIds`
- refresh-token rotation/revocation using `refreshTokenVersion`
- super-admin selected-school validation against the live `School` collection
- immutable payment ledger with reversal/refund workflow
- tenant-scoped financial reconciliation

---

## 5. Tenant Isolation — Current State

Core tenant-owned CRUD/reporting controllers currently scope database queries using `req.user.schoolId` or an equivalent tenant helper, including:
- students
- teachers
- classes/sections/subjects
- attendance
- fees/payments
- dashboard
- parent access
- school settings

The fee payment workflow uses a MongoDB transaction so Payment creation and Fee balance/status updates are atomic.

### Remaining security-sensitive follow-up
- sensitive document delivery should move from permanent Cloudinary URLs to private/authenticated delivery
- dashboard chart queries should be batched before larger deployments
- standardize school timezone/reporting timezone

---

## 6. Authentication Architecture

Current authoritative mechanism:
```text
HttpOnly access_token cookie
        +
HttpOnly refresh_token cookie
```

Frontend behavior:
- no auth token in localStorage
- login stores only user state in memory
- app calls `/auth/me` during bootstrap
- Axios refreshes the session when an authenticated request receives 401
- logout calls `/auth/logout` and clears client state

Do not reintroduce persistent access-token storage in browser localStorage/sessionStorage.

---

## 7. Permissions

`shared/src/constants/index.ts` is the source of truth for `ROLE_PERMISSIONS`.

Server RBAC and frontend permission checks should consume the shared definition.

Do not duplicate role-permission maps in the client.

Principal has `settings:read` and `settings:write` permissions for school administration.

For attendance:
- teachers retain `attendance:write` for marking attendance in their assigned classes
- corrections to an existing attendance record are restricted in the controller to `principal` and `super_admin`

---

## 8. School Settings and Academic Years — Phase 2 COMPLETED

Implemented and verified:
```text
GET   /api/v1/school/settings
PATCH /api/v1/school/settings
```

Rules:
- authentication required
- `settings:read` for reads
- `settings:write` for writes
- school is resolved only from authenticated `req.user.schoolId`
- school code is immutable
- academic year cannot be changed through settings endpoint
- update schema allows only school profile/settings fields
- updates create before/after AuditLog records

Phase 2 has exited. Remaining administration polish continues only where it is a dependency for later phases.

---

## 9. Attendance — Phase 3 IN PROGRESS

Current attendance behavior:
- attendance remains tenant-scoped by authenticated/resolved school context
- teacher access remains class-teacher scoped through `Teacher.classTeacherOf`
- student attendance remains self-only
- parent attendance remains linked-child-only
- attendance creation validates class/section ownership and active student membership
- duplicate students within one submission are rejected
- school/class/section/date uniqueness is enforced by a MongoDB unique index
- attendance creation/correction is restricted to the school-configured current academic year
- existing attendance records are now corrected only by principal/super-admin
- attendance corrections produce explicit `CORRECT` audit events
- monthly reports are restricted to the current academic year and return the academic-year name
- attendance write/query date inputs use strict `YYYY-MM-DD` calendar-date semantics to match server-side UTC calendar parsing
- student attendance date ranges use an attendance-specific calendar-date validator
- attendance collection filters are validated by `AttendanceQuerySchema`, preserving class/section/date/date-range filters
- student attendance views use the shared `getTenantId()` helper, including super-admin selected-school context

### Bulk attendance workflow
`POST /api/v1/attendance/bulk` is implemented for bounded multi-day create/correction.

Rules:
- 1–31 entries per request
- maximum 5000 student records total
- duplicate class/section/day entries in one request are rejected
- every class, section, and active student is validated against the resolved tenant
- every teacher entry is checked against `Teacher.classTeacherOf`
- every date is checked against the current academic year
- existing attendance days are corrections and require principal/super-admin
- all changes and audit events run in one MongoDB transaction

Regression coverage exists for bulk payload bounds and duplicate day detection.

### Phase 3 acceptance
A dedicated Playwright attendance gate exists at `server/scripts/phase3-attendance-gate.mjs` with `npm run test:e2e:phase3:attendance:gate`.

Remaining Phase 3 work:
- run/complete the live attendance acceptance gate against the deployed bulk workflow
- harden timezone-safe reporting semantics if a persisted school timezone is required
- add spreadsheet import/export on top of the bulk service
- keep student/teacher attendance views tenant- and ownership-scoped

---

## 10. File Uploads

Current flow:
```text
Multer
  ↓
Buffer
  ↓
Cloudinary
```

Permanent files must not use local Render disk.

### Remaining privacy work
Student/teacher documents currently store Cloudinary secure URLs. Before production, sensitive documents should use a private/authenticated delivery strategy with controlled access rather than permanent public URLs.

---

## 11. PDF / Reports

Server-side PDFKit is used for fee receipts and ID cards.

Remaining work:
- replace hardcoded school placeholders with tenant School configuration
- actual student/teacher photos
- QR generation where required
- standardized timezone/date handling

---

## 12. Performance / Correctness Work Remaining

Dashboard chart generation is tenant-safe but currently performs repeated queries in loops. Replace with batched aggregation queries before larger deployments.

Standardize school timezone/reporting timezone instead of relying on server-local `Date` behavior.

Progressively remove business-critical `any` usage; avoid giant unrelated type rewrites.

---

## 13. Feature Gaps

Not fully implemented:
- parent portal UI
- student portal
- teacher portal
- exams/marks/results
- homework
- timetable
- library
- transport
- inventory
- expenses
- payroll/staff/leave
- SMS/push/WhatsApp
- payment gateway
- subscriptions/SaaS administration
- advanced backup/recovery
- production observability
- mobile app

Permission entries for future features do not mean those modules are implemented.

Transport is referenced by Student but no complete Transport module exists yet. Do not build against it without defining requirements/model.

---

## 14. Immediate Development Order

Continue in this order:

```text
1. Run Phase 3 attendance E2E gate and resolve live failures
2. Harden Phase 3 attendance timezone/reporting semantics
3. Add spreadsheet import/export on top of the bulk attendance service
4. Finish administration search/filter/pagination and bulk workflows where needed
5. Finish sensitive document private/authenticated delivery
6. Batch dashboard aggregations and standardize reporting timezone
7. Finish Phase 4 financial hardening and reports
8. Add exams/results
9. Add notifications
10. Add portals
11. Add SaaS administration
12. Add mobile
```

Do not prioritize microservices, Kubernetes, complex AI/ML, GPS tracking, WhatsApp automation, or large-scale caching before the core ERP is correct.

---

## 15. AI Coding Contract

Before coding, inspect:
```text
prd.md
architecture.md
rules.md
design.md
phases.md
memory.md
```

During coding:
- preserve existing architecture
- use TypeScript
- reuse existing components/API utilities/shared schemas/constants
- enforce tenant isolation
- add tests for business-critical changes
- avoid unrelated refactors

After coding:
- verify build
- verify tests
- verify authorization and tenant safety
- verify error states
- update docs when behavior/architecture changes

Memory is living context, not proof. Refresh it after meaningful implementation changes.
