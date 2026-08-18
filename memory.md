# School ERP — AI Project Memory

> **Purpose:** Compact operational memory for AI coding agents. Verify important claims against the repository before relying on them.

**Last verified:** 18 August 2026
**Repository status:** actively developed; incomplete; not production-ready.

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

## 4. Security Baseline — Verified 18 Aug 2026

Implemented:
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
- hardcoded demo password removed from seed and login UI
- Excel import/export migrated away from SheetJS `xlsx`
- spreadsheet import row cap (5,000)

The frontend no longer persists access tokens in localStorage. Authentication is now cookie-authoritative and the app restores the session through `/auth/me`.

---

## 5. Tenant Isolation — Current State

Core tenant-owned CRUD/reporting controllers currently scope database queries using `req.user.schoolId` or an equivalent tenant helper, including:
- students
- teachers
- classes/sections/subjects
- attendance
- fees/payments
- dashboard

The fee payment workflow uses a MongoDB transaction so Payment creation and Fee balance/status updates are atomic.

### Remaining P0/P1 tenant work

#### P0 — Login tenant selection
Login still searches by email alone while user uniqueness is `(email, schoolId)`.

Required future design:
- explicit tenant identifier such as school code/slug/subdomain
- login must resolve the tenant first and then query `{ email, schoolId }`

Do not remove the composite uniqueness constraint.

#### P1 — Audit log tenant metadata
AuditLog currently lacks an explicit `schoolId` field. Add tenant metadata and tenant-scoped audit querying before exposing audit logs to school users.

#### P1 — School configuration
School model needs a stable public tenant identifier (for example code/slug) before tenant-aware login can be completed cleanly.

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

---

## 8. File Uploads

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

## 9. PDF / Reports

Server-side PDFKit is used for fee receipts and ID cards.

Remaining work:
- replace hardcoded school placeholders with tenant School configuration
- actual student/teacher photos
- QR generation where required
- standardized timezone/date handling

---

## 10. Performance / Correctness Work Remaining

Dashboard chart generation is tenant-safe but currently performs repeated queries in loops. Replace with batched aggregation queries before larger deployments.

Standardize school timezone/reporting timezone instead of relying on server-local `Date` behavior.

Progressively remove business-critical `any` usage; avoid giant unrelated type rewrites.

---

## 11. Feature Gaps

Not fully implemented:
- parent portal
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

## 12. Immediate Development Order

Continue in this order:

```text
1. Tenant-aware login + School public identifier
2. AuditLog tenant isolation
3. Production-critical security/tenant tests
4. Sensitive document access hardening
5. PDF/School configuration correctness
6. Dashboard aggregation + timezone standardization
7. Core admin correctness
8. Exams/results
9. Notifications
10. Portals
11. SaaS administration
12. Mobile
```

Do not prioritize microservices, Kubernetes, complex AI/ML, GPS tracking, WhatsApp automation, or large-scale caching before the core ERP is correct.

---

## 13. AI Coding Contract

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
