# School ERP — AI Project Memory

> **Purpose:** This file is a compact operational memory for AI coding agents.
> An agent should be able to read this file plus the other project documents and understand the
> repository without relying on previous chat history.
>
> **Last analyzed:** 11 August 2026
>
> **Repository status:** actively developed; incomplete; not production-ready.

---

# 1. Project Snapshot

The project is a School ERP intended to become an industry-grade multi-tenant SaaS.

Current target:
- initially support one school
- approximately 500 students
- later support 3–4 schools / ~3,000 students
- eventually scale to many schools

The developer wants low operating cost but does not want low-quality architecture.

The project should therefore use a modular monolith first and scale infrastructure only when justified.

---

# 2. Current Repository Structure

```text
school-erp/
├── client/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── layouts/
│       ├── lib/
│       ├── pages/
│       ├── routes/
│       ├── store/
│       ├── styles/
│       ├── test/
│       ├── types/
│       └── utils/
│
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       ├── validators/
│       └── server.ts
│
├── shared/
│   └── src/
│       ├── constants/
│       ├── schemas/
│       └── utils/
│
├── docker-compose.yml
├── package.json
├── turbo.json
└── README.md
```

---

# 3. Current Technology

## Frontend
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

## Backend
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
- xlsx
- Zod

## Testing
- Vitest
- Playwright
- Testing Library
- jsdom

## Tooling
- Turbo
- npm
- Docker Compose
- MongoDB 7

---

# 4. Current Frontend Pages

Implemented routes include:

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

Authentication is protected by `RequireAuth`.

Main authenticated layout:
- AdminLayout
- Header
- Sidebar

---

# 5. Current Backend Routes

Current API groups:

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

Important route details:

### Auth
- register
- login
- refresh
- logout
- me
- change password

### Students
- list
- export
- detail
- create
- update
- delete
- bulk import
- document upload

### Teachers
- CRUD foundation
- documents/ID-related functionality

### Academics
- classes
- sections
- subjects

### Attendance
- list
- mark
- student attendance
- monthly report

### Fees
- fee structures
- fee CRUD
- student fees
- fee generation
- payment collection
- payment list
- daily collection
- monthly collection
- receipt PDF

### Dashboard
- stats
- charts
- birthdays

---

# 6. Current Data Models

Implemented Mongoose models:

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

Most tenant-owned models contain `schoolId`.

---

# 7. Current Shared Enums/Roles

Roles:

```text
SUPER_ADMIN
PRINCIPAL
ACCOUNTANT
TEACHER
STUDENT
PARENT
```

Statuses include:
- active/inactive/suspended
- student active/left/graduated/transferred
- teacher active/inactive/on_leave
- attendance present/absent/late/half_day/on_leave
- fee paid/partial/pending/overdue/waived

Payment modes:

```text
cash
upi
card
bank_transfer
cheque
online
```

---

# 8. Current Security Foundation

Already present:
- JWT access token
- JWT refresh token
- HTTP-only cookies
- bcrypt password hashing
- Helmet
- CORS
- rate limiting
- Zod validation
- RBAC
- audit logs

However, the current system is **not yet safe for multi-school production**.

---

# 9. Critical Known Problems Found During Codebase Analysis

## P0 — Tenant isolation is incomplete

Some controllers perform queries without `schoolId`.

Examples include patterns such as:
- `findById`
- `find(...)` with only class/date filters
- dashboard queries without tenant scope
- fee structure queries without tenant scope
- attendance queries without tenant scope

This must be fixed before multi-school deployment.

### Rule

Every tenant-owned query must be scoped to:

```text
req.user.schoolId
```

---

## P0 — Login is not fully tenant-aware

Current login searches by email:

```text
User.findOne({ email: data.email })
```

while the user uniqueness constraint is:

```text
email + schoolId
```

That creates a design mismatch.

Future login must define how the system identifies the school/tenant, for example:
- school slug/subdomain
- school code
- tenant identifier
- platform login that explicitly selects school

Do not blindly remove the schoolId uniqueness constraint.

---

## P0 — Financial payment operation needs transaction safety

Current payment flow:
1. create Payment
2. update Fee
3. audit

This is not enough for a production financial system.

Convert it to an atomic operation using a MongoDB transaction.

---

## P0 — Permission definitions are duplicated

Permissions exist in shared constants and also in the client auth store.

This can drift.

Make shared permission metadata the source of truth.

---

## P1 — Client auth persistence needs security review

Zustand persist stores user state.

The access token is also updated in client state after refresh.

Review this so long-lived credentials are not persisted unnecessarily in browser storage.

Prefer HTTP-only cookies as the authoritative auth mechanism.

---

## P1 — PDF content is hardcoded

Current receipt/ID-card PDF code contains placeholder values such as:
- "School Name"
- "School Address"
- placeholder phone
- text-based PHOTO/QR placeholders

These must use tenant school configuration and actual image/QR generation before production.

---

## P1 — Shared package/build arrangement needs cleanup

Client points `@school-erp/shared` to:

```text
../shared/dist
```

Server uses a local `src/shared-types` path.

Shared types/schemas are therefore not fully centralized.

Future target:
- one shared package
- consistent build/reference strategy
- no duplicated domain types

---

## P1 — Date/time handling needs standardization

Attendance and dashboard code uses native `Date` calculations.

For a multi-school product, explicitly define:
- school timezone
- storage timezone
- reporting timezone
- academic-day boundaries

Do not let server host timezone silently define school attendance dates.

---

## P1 — Some dashboard queries are inefficient

The dashboard chart code performs repeated database queries inside loops.

This should be optimized with:
- aggregation
- batch queries
- precomputed summaries
- caching where justified

Do not prematurely optimize ordinary CRUD, but dashboard aggregation should be fixed before large deployments.

---

## P1 — Some code uses hardcoded `any`

Examples exist in controllers and pages.

Replace `any` progressively in business-critical areas.

Do not perform a giant unrelated type rewrite.

---

## P1 — Feature permissions exist before features

Permission constants already mention:

```text
homework
marks
expenses
salary
```

but corresponding complete modules are not yet implemented.

Do not treat the permission enum as proof that the feature exists.

---

## P1 — Transport is referenced but not implemented

Student model contains:

```text
transportId
```

with a Transport reference, but a Transport model/module is not present in the current repository.

Do not build against a nonexistent Transport entity without first defining the model and requirements.

---

# 10. Current Testing

Vitest and Playwright are already configured.

Current unit tests exist for utilities/schemas.

However, production-critical tests are still missing.

Priority tests:

```text
tenant isolation
authentication
RBAC
student CRUD
attendance
fee generation
payment collection
receipt generation
file upload authorization
```

---

# 11. Current File Upload Strategy

Cloudinary integration exists.

Upload flow:

```text
Multer
  ↓
Buffer
  ↓
Cloudinary upload service
  ↓
secure URL + public ID
```

Do not switch to local Render disk for permanent files.

---

# 12. Current PDF Strategy

PDFKit server-side.

Existing:
- fee receipt
- student ID card
- teacher ID card

Keep server-side PDF generation.

---

# 13. Current UI Strategy

The UI is Tailwind-based and has reusable primitives.

Do not replace the entire UI architecture.

Continue with:
- Card
- Table
- Modal
- Button
- Input
- Select
- Tabs
- Badge
- Toaster

Extract repeated patterns as the application grows.

---

# 14. Current Product Gaps

Not fully implemented:
- parent portal
- student portal
- teacher portal
- mobile app
- SMS
- push notifications
- WhatsApp
- payment gateway
- exams
- marks/results
- homework
- timetable
- library
- transport
- inventory
- expenses
- payroll
- staff
- leave
- subscriptions
- SaaS tenant administration
- advanced backup/recovery
- production observability

---

# 15. Immediate Recommended Work

When asked "what should I implement next?", default to:

```text
1. Tenant isolation
2. Auth/session hardening
3. Shared permissions/schemas
4. Security + tenant tests
5. Core admin correctness
6. Attendance hardening
7. Fee/payment transaction safety
8. Reports/PDF correctness
9. Exams/results
10. Notifications
11. Portals
12. Mobile
13. SaaS platform
```

---

# 16. Things Not to Do Yet

Do not prioritize:
- microservices
- Kubernetes
- complex AI
- GPS tracking
- WhatsApp automation
- advanced ML
- massive caching
- event-driven architecture everywhere

until the core ERP is correct.

---

# 17. Important Developer Context

The project is being built by one developer and is intentionally budget-conscious.

Preferred philosophy:

```text
low infrastructure cost
+
strong architecture
+
incremental development
+
production-grade security
```

The developer wants the application to work locally first and be deployable later.

Do not assume cloud-only operation.

---

# 18. Current Architecture Decision

Current database remains:

```text
MongoDB + Mongoose
```

Do not migrate to PostgreSQL unless the developer explicitly chooses that architecture.

MongoDB can support the intended initial scale if:
- tenant indexes are correct
- transactions are used for financial workflows
- queries are scoped
- pagination is used
- backups are configured

---

# 19. AI Agent Working Contract

When an AI agent receives a task:

### Before coding
Read:

```text
prd.md
architecture.md
rules.md
design.md
phases.md
memory.md
```

Then inspect the relevant source files.

### During coding
- preserve existing patterns
- use TypeScript
- reuse existing components
- reuse existing API utilities
- reuse shared schemas/constants
- enforce tenant isolation
- add tests
- avoid unrelated refactors

### After coding
Verify:
- build
- tests
- lint if configured
- tenant safety
- authorization
- error states
- docs if behavior changed

---

# 20. Document Maintenance

When architecture changes:
- update `architecture.md`
- update `memory.md`

When product scope changes:
- update `prd.md`
- update `phases.md`

When engineering constraints change:
- update `rules.md`

When UI conventions change:
- update `design.md`

These files are living project documentation, not one-time notes.
