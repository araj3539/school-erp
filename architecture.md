# School ERP — Architecture

> **Purpose:** Technical source of truth for the current repository and the intended production architecture.
>
> **Repository analyzed:** 11 August 2026
>
> **Current stack is preserved unless an explicit architecture decision changes it. Do not silently migrate
> MongoDB, authentication, or framework choices while implementing a feature.**

---

## 1. Current Architecture Summary

The repository is a TypeScript monorepo-style project:

```text
school-erp/
├── client/                 # React SPA
├── server/                 # Express REST API
├── shared/                 # Shared Zod schemas/constants/utilities
├── docker-compose.yml      # Local MongoDB
├── package.json
├── turbo.json
└── documentation/
```

Current stack:

- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS
- Routing: React Router
- Server state: TanStack Query
- Client state: Zustand
- Forms: React Hook Form
- Validation: Zod
- HTTP: Axios
- Backend: Node.js + Express + TypeScript
- Database: MongoDB + Mongoose
- Auth: JWT + HTTP-only cookies + refresh token
- Password hashing: bcryptjs
- Security middleware: Helmet, CORS, rate limiter
- Files: Cloudinary
- PDFs: PDFKit
- Excel: xlsx
- Tests: Vitest + Playwright
- Monorepo tooling: Turbo
- Local DB: Docker Compose MongoDB 7

---

## 2. Runtime Topology

Current intended local flow:

```text
Browser
   |
   | HTTP / JSON / cookies
   v
React + Vite
   |
   | /api
   v
Express API
   |
   +------> MongoDB
   |
   +------> Cloudinary (optional)
   |
   +------> PDFKit
   |
   +------> Excel service
```

Future production flow:

```text
                         Internet
                            |
                    CDN / Reverse Proxy
                       /           \
                      /             \
             Web application       API
              (static CDN)      (Node/Express)
                                    |
                  +-----------------+----------------+
                  |                 |                |
               MongoDB           Redis          Object Storage
                  |                 |                |
             persistent       cache/queue       documents/media
                  |
             Backup system
                  |
             Monitoring/Logs
```

The exact providers may change. The application must not depend on a specific provider where an abstraction is practical.

---

## 3. Multi-Tenancy Model

### Current model

Most school-owned models contain:

```text
schoolId: ObjectId
```

Examples:
- User
- School
- AcademicYear
- Student
- Teacher
- Class
- Section
- Attendance
- FeeStructure
- Fee
- Payment

The authenticated JWT also contains:

```text
schoolId
```

### Required production invariant

For any school user:

```text
effectiveSchoolId = authenticatedUser.schoolId
```

Never trust a client-supplied school ID for authorization.

Every school-scoped read/update/delete must enforce:

```text
resource.schoolId == authenticatedUser.schoolId
```

or an equivalent server-side tenant scope.

### Critical current-state issue

Several controllers currently query by `_id`, classId, date, etc. without consistently adding `schoolId`.

Examples observed in the current code include:
- attendance queries
- class/section/subject operations
- fee structure operations
- some dashboard queries
- authentication lookup behavior

This is a **production-blocking multi-tenancy risk**.

The architecture must eventually centralize tenant scoping rather than relying on every developer to remember it manually.

---

## 4. Recommended Tenant-Scoped Data Access Pattern

Preferred pattern:

```text
Request
  |
authenticate()
  |
req.user = { userId, role, schoolId }
  |
tenant context
  |
service/repository
  |
Mongo query always includes schoolId
```

Do not let controllers construct unrestricted Mongo queries for tenant-owned data.

A future repository/service layer should expose operations such as:

```ts
studentRepository.findMany({
  schoolId,
  filters
})
```

rather than:

```ts
Student.find(filters)
```

For resource-by-ID operations:

```ts
Student.findOne({
  _id: id,
  schoolId: req.user.schoolId
})
```

Never:

```ts
Student.findById(id)
```

for a school-owned resource.

---

## 5. Backend Layering

Current code is organized as:

```text
routes
  -> middleware
  -> controllers
  -> models/services
```

Recommended production layering:

```text
routes
  ↓
authentication / authorization / validation
  ↓
controller
  ↓
application service
  ↓
repository/data access
  ↓
Mongoose model
```

### Responsibilities

**Routes**
- URL/method
- middleware composition
- validation selection
- permission requirement

**Middleware**
- authentication
- authorization
- request validation
- rate limiting
- uploads
- cross-cutting concerns

**Controllers**
- translate HTTP request to application command/query
- return HTTP response
- should remain thin

**Services**
- business rules
- multi-step operations
- transactions
- integrations
- calculations

**Repositories**
- data access
- tenant scoping
- pagination
- common query patterns

**Models**
- persistence schema
- indexes
- basic data-level constraints

---

## 6. Current Authentication Architecture

Current flow:

```text
Login
  |
email + password
  |
bcrypt comparison
  |
access JWT + refresh JWT
  |
HTTP-only cookies
```

Access token:
- short-lived
- signed with JWT secret

Refresh token:
- longer-lived
- signed with separate secret

The server reads the access token from:

```text
access_token
```

and refresh token:

```text
refresh_token
```

### Production requirements

- Keep tokens HTTP-only.
- Keep secure cookies in production.
- Use explicit SameSite policy appropriate to deployment.
- Add refresh-token rotation/revocation strategy.
- Consider server-side session/token-family tracking for high-security deployments.
- Never store raw long-lived secrets in localStorage.
- Do not rely on client Zustand state for authorization.

### Current issue

The client persists auth state with Zustand. The client also stores an `accessToken` field in the user state when refresh occurs.

This should be reviewed so that the browser does not persist sensitive bearer credentials unnecessarily. The HTTP-only cookie should be the authoritative transport mechanism.

---

## 7. Authorization Architecture

Current system has:
- role enum
- permission map
- `requireRole`
- `requirePermission`
- ownership middleware

Current roles:

```text
super_admin
principal
accountant
teacher
student
parent
```

### Required rule

Frontend permission checks are for UX only.

Backend permission checks are mandatory.

The frontend must never be considered a security boundary.

### Current duplication problem

Role permissions are defined in:
- shared constants
- client auth store

This can drift.

Preferred future design:

```text
shared permission definitions
          |
          +--> server authorization
          |
          +--> client UI visibility
```

The client should not maintain a separate copy unless it is generated from a shared source.

---

## 8. Database Model

Current entities:

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

Important relationships:

```text
School
 ├── Users
 ├── AcademicYears
 ├── Students
 ├── Teachers
 ├── Classes
 ├── Sections
 ├── Subjects
 ├── Attendance
 ├── FeeStructures
 ├── Fees
 ├── Payments
 └── AuditLogs
```

### Planned future entities

```text
Guardian
Staff
StudentEnrollment
TeacherAssignment
Exam
ExamSubject
Mark
Grade
Homework
Notice
Notification
Timetable
LibraryBook
LibraryIssue
TransportRoute
Vehicle
Driver
Expense
Payroll
Leave
Document
Subscription
Invoice
PaymentTransaction
WebhookEvent
```

---

## 9. Financial Architecture

Financial records require stronger consistency than ordinary CRUD.

Current model:

```text
FeeStructure
      |
      v
Fee
      |
      v
Payment
```

A payment updates:
- Payment record
- Fee paidAmount
- Fee balance
- Fee status
- audit log

### Production requirement

Payment collection must become an atomic business operation.

Preferred:

```text
transaction:
  validate fee
  validate amount
  create payment
  update fee
  create audit event
commit
```

If any step fails, the entire operation must roll back.

Never allow:
- payment without corresponding balance reduction
- balance reduction without payment record
- duplicate external payment
- duplicate receipt
- negative balance

---

## 10. PDF Architecture

Current PDF generation uses PDFKit on the server.

Current outputs include:
- fee receipt
- student ID card
- teacher ID card

This is the correct architectural direction for authoritative documents.

Future:

```text
PDF service
 ├── Receipt renderer
 ├── ID card renderer
 ├── Marksheet renderer
 ├── TC renderer
 ├── Certificate renderer
 └── Payslip renderer
```

Templates should obtain school branding/configuration from the tenant rather than hardcoded text.

The current PDF service contains placeholder school name/address/phone and should be converted to tenant-driven data before production.

---

## 11. File Storage Architecture

Current integration:
- Cloudinary
- Multer
- server-side upload service

Required abstraction:

```text
FileStorage
 ├── upload()
 ├── delete()
 ├── getUrl()
 └── metadata()
```

Cloudinary can be the first implementation.

Do not store permanent user documents on Render/local ephemeral application disk.

Files should be:
- tenant scoped
- access controlled
- validated by MIME/type and size
- named safely
- auditable where sensitive

---

## 12. API Architecture

Current base path:

```text
/api/v1
```

Current route groups:

```text
/auth
/students
/teachers
/academics
/attendance
/fees
/dashboard
/health
```

Future route groups should follow the same modular pattern:

```text
/schools
/users
/academic-years
/classes
/sections
/subjects
/students
/guardians
/teachers
/staff
/attendance
/exams
/results
/homework
/fees
/payments
/expenses
/payroll
/library
/transport
/notices
/notifications
/reports
/documents
/audit-logs
```

Use consistent response shapes.

Example:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "totalPages": 25
  }
}
```

Errors should have a stable structure.

---

## 13. Validation Architecture

Shared package contains Zod schemas and constants.

Current issue:
- server also has its own validator layer
- client uses schemas directly in several places
- server/client shared validation is not fully unified

Target:

```text
shared/
  schemas/
  constants/
  types/
  utils/
```

The same business input schema should be reusable where possible.

Important:
- client validation improves UX
- server validation protects the system
- database constraints remain a final persistence guard

---

## 14. Frontend Architecture

Current:

```text
App
 └── Router
      ├── AuthLayout
      │    └── Login
      └── RequireAuth
           └── AdminLayout
                ├── Dashboard
                ├── Students
                ├── Student Detail
                ├── Teachers
                ├── Classes
                ├── Attendance
                ├── Fees
                ├── Reports
                └── Settings
```

Reusable UI primitives already exist:
- Button
- Input
- Select
- Card
- Modal
- Table
- Tabs
- Badge
- Toaster

This component foundation should be retained and expanded rather than replaced without reason.

---

## 15. State Management

Use:
- TanStack Query for server state
- Zustand for small client-only/global state

Do not duplicate server entities in Zustand unless there is a clear offline/local-state reason.

Query invalidation should be predictable.

Example:

```text
create student
  -> invalidate students list
  -> invalidate dashboard if needed
```

---

## 16. Testing Architecture

Current tools:
- Vitest
- Playwright
- Testing Library
- jsdom

Test layers:

```text
Unit
  ↓
service/business rules
  ↓
API integration
  ↓
E2E critical workflows
```

Critical E2E flows:
1. login/logout
2. student creation
3. student search/detail
4. attendance marking
5. fee generation
6. payment collection
7. receipt generation
8. role restriction
9. tenant isolation
10. file upload

---

## 17. Performance Architecture

Current scale is small enough for a single API instance and MongoDB instance.

At 500–3,000 students:
- pagination
- indexes
- reasonable aggregation
- object storage
- caching where useful

should be sufficient.

Avoid premature microservices.

Start with a modular monolith:

```text
one API
one database
clear modules
clear services
clear boundaries
```

Introduce queues/background workers when needed for:
- bulk SMS
- email
- report generation
- large exports
- scheduled reminders
- backups
- notification fan-out

---

## 18. Observability

Production should have:
- structured logs
- request IDs
- error tracking
- uptime monitoring
- database metrics
- external integration failure metrics
- audit logs

Never log:
- passwords
- access tokens
- refresh tokens
- API secrets
- sensitive document contents

---

## 19. Deployment Strategy

Initial cloud target can remain simple:

```text
Frontend -> Vercel/Cloudflare Pages
API -> Render/VPS/container platform
MongoDB -> MongoDB Atlas or managed MongoDB
Files -> Cloudinary/object storage
```

As usage grows:

```text
CDN
  +
load-balanced API
  +
managed MongoDB replica set
  +
Redis
  +
worker
  +
object storage
```

The application must not assume a writable persistent local filesystem.

---

## 20. Architecture Decision Guardrails

Do not:
- migrate databases casually
- rewrite authentication casually
- introduce microservices prematurely
- add a second state-management library without need
- add a UI framework that duplicates existing primitives
- bypass tenant filtering
- put financial logic in React components
- put business rules directly in route handlers
- hardcode school-specific data into PDFs or UI

---

## Documentation Lifecycle & Versioning

This architecture document is a **living technical source of truth**. It describes the architecture that actually exists plus explicitly identified target architecture. It must never silently drift away from the repository.

### Status Metadata

- **Document version:** 1.1.0
- **Lifecycle status:** Living / actively maintained
- **Baseline verified:** 11 August 2026
- **Current implementation state:** Modular monolith under active development
- **Verification source:** Repository working tree, package manifests, routes, models, services, shared schemas, and infrastructure files
- **Next mandatory review:** After each phase, database/schema change, API contract change, authentication/authorization change, infrastructure change, or dependency migration

### Architecture Truth Model

Use these labels consistently:
- **CURRENT:** verified to exist in the codebase today
- **TARGET:** approved future architecture that is not fully implemented
- **DEPRECATED:** previously used approach that should not receive new code
- **RISK:** known mismatch, weakness, or architectural debt

Never describe TARGET architecture as CURRENT until it has been implemented and verified.

### Mandatory Synchronization Events

Update this file when:
- a new service/module/package is introduced
- API routes, authentication, authorization, or tenant boundaries change
- database collections, indexes, relationships, or schemas change
- deployment topology or external services change
- caching, queues, storage, observability, or messaging architecture changes
- a major dependency/framework is added, removed, or replaced
- a security or scalability decision changes

### Phase Verification

At phase completion, compare the architecture document against the repository and record:
1. what was implemented
2. what remains planned
3. any deviations from the target design
4. new risks/technical debt
5. architectural decisions made during the phase

### Versioning

- **MAJOR:** fundamental architecture or system-boundary change
- **MINOR:** new subsystem, significant data/API/infrastructure capability, or approved architectural decision
- **PATCH:** corrections, clarifications, diagrams, or status updates without architectural meaning change

### AI Rule

Before implementing a cross-cutting technical change, an AI agent must check this document and `rules.md`. After implementation, it must verify the actual repository and update this document if the architecture changed. Never invent an architecture detail simply because it appears in a plan.

### Changelog

| Version | Date | Change | Verified By |
|---|---|---|---|
| 1.1.0 | 2026-08-11 | Added CURRENT/TARGET model, lifecycle, verification, and versioning. | AI-assisted repository review |
| 1.0.0 | 2026-08-11 | Initial repository-based architecture documentation. | AI-assisted repository review |

