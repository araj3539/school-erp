# School ERP — Product Requirements Document (PRD)

> **Document purpose:** This is the product-level source of truth for the School ERP.
> It describes what the system is, who it serves, what is already implemented, what remains,
> and the rules that must guide future development.
>
> **Repository state analyzed:** 11 August 2026
>
> **Important:** The uploaded codebase is an actively developed Phase-1 application, not a finished
> production system. "Implemented" below means the repository contains meaningful code for the
> capability; it does not mean the capability is production-complete.

---

## 1. Product Identity

**Product name:** School ERP / School Management System

**Product type:** Multi-tenant school administration platform.

**Primary deployment model:**
1. Local development / school-local deployment during early adoption.
2. Cloud-hosted SaaS for multiple schools as the product matures.

**Initial target:** A complete ERP for an individual school, designed so the same codebase can safely serve multiple schools.

**Long-term target:** Industry-grade multi-school SaaS supporting school administration, academics, attendance, fees, communication, reporting, documents, and parent/teacher/student experiences.

---

## 2. Product Vision

The system should become the operational system of record for a school.

A school should be able to manage:

- school identity and configuration
- academic years
- students and guardians
- teachers and staff
- classes, sections and subjects
- attendance
- fee structures, dues and payments
- receipts and financial reports
- examinations and marks
- homework and notices
- timetables
- documents
- library
- transport
- expenses and payroll
- parent/student/teacher access
- SMS/push/email communication
- analytics and dashboards
- audit history
- backups and recovery

The platform must be designed so that adding another school does not require creating a separate application or database manually.

---

## 3. Users and Roles

### 3.1 Super Admin
Platform-level operator.

Expected capabilities:
- create/manage schools
- manage school administrators
- platform configuration
- tenant lifecycle
- subscription/billing when SaaS is introduced
- support/diagnostics
- cross-tenant operations only where explicitly authorized

**Important:** A platform Super Admin must not be confused with a school administrator. Tenant boundaries still apply.

### 3.2 Principal
School-level administrative authority.

Expected capabilities:
- students
- teachers
- classes
- sections
- attendance oversight
- fees oversight
- reports
- school settings
- user management
- notices
- academic configuration

### 3.3 Accountant
Financial operations.

Expected capabilities:
- fee structures
- fee generation
- payment collection
- receipts
- collections
- financial reports
- expenses
- salary/payroll when implemented

### 3.4 Teacher
Academic/classroom operations.

Expected capabilities:
- assigned students
- attendance for permitted classes
- homework
- marks
- notices
- timetable

### 3.5 Parent
Child-focused access.

Expected capabilities:
- child's attendance
- homework
- marks/results
- fee status
- notices
- timetable
- communication

### 3.6 Student
Own academic information.

Expected capabilities:
- own attendance
- homework
- results
- fees
- notices
- timetable

---

## 4. Current Repository Scope

The current repository already contains these major areas:

| Area | Current state |
|---|---|
| Authentication | Implemented foundation |
| RBAC | Implemented foundation |
| Students | Implemented |
| Teachers | Implemented |
| Classes/Sections/Subjects | Implemented foundation |
| Attendance | Implemented |
| Fees | Implemented |
| Payments | Implemented |
| PDF receipts/ID cards | Implemented foundation |
| Cloudinary uploads | Implemented foundation |
| Dashboard | Implemented |
| Reports | Implemented foundation |
| School settings | Implemented foundation |
| Academic years | Implemented foundation |
| Audit logging | Implemented foundation |
| Excel import/export | Backend service/endpoints exist |
| Parent portal | Not yet implemented |
| Student portal | Not yet implemented |
| Mobile app | Not present in current repository |
| SMS | Not implemented |
| Push notifications | Not implemented |
| WhatsApp | Not implemented |
| Online payment gateway | Not implemented |
| Exams/marks | Permission/schema groundwork exists, feature not implemented |
| Homework | Permission groundwork exists, feature not implemented |
| Timetable | Not implemented |
| Library | Not implemented |
| Transport | Only a student reference exists; feature not implemented |
| Payroll/expenses | Permission groundwork exists, feature not implemented |
| Subscription/billing | Not implemented |
| SaaS tenant administration | Not implemented as a complete platform |

---

## 5. Core Functional Requirements

### 5.1 Authentication
Must support:
- login
- logout
- access token
- refresh token
- password hashing
- password change
- session expiration
- inactive-user rejection
- secure HTTP-only cookies
- audit events

Future:
- password reset
- email/phone verification
- optional 2FA
- session/device management
- forced logout
- account lockout/risk controls

### 5.2 School/Tenant Management
Each school must have:
- unique school identifier
- name
- logo
- address
- phone
- email
- current academic year
- settings
- branding
- enabled modules
- notification configuration

Every school-owned record must be tenant-scoped.

### 5.3 Academic Year
Support:
- create year
- start/end dates
- current-year selection
- historical years
- year-specific classes/fees/results
- safe year rollover

Only one current academic year should be active per school.

### 5.4 Student Management
Support:
- admission number
- profile
- class/section
- parent/guardian information
- DOB/gender/blood group
- contact details
- address
- previous school
- documents
- status
- admission date
- bulk import
- export
- ID card
- student detail view

Future:
- formal guardian entity
- siblings
- admission workflow
- promotion
- TC workflow
- alumni
- student portal account
- attendance/fee/result timeline

### 5.5 Teacher/Staff Management
Support:
- employee ID
- profile
- qualification
- experience
- joining date
- salary
- subjects
- class teacher assignment
- documents
- status
- ID card

Future:
- non-teaching staff entity
- leave
- payroll
- payslips
- attendance
- performance
- employment documents

### 5.6 Academic Structure
Support:
- classes
- sections
- capacity
- class teacher
- room
- subjects
- subject teacher assignment

Future:
- academic session-specific class assignment
- subject periods
- timetable
- teacher workload

### 5.7 Attendance
Support:
- date-based attendance
- class/section
- present
- absent
- late
- half-day
- leave
- remarks
- monthly report
- student attendance summary

Future:
- teacher/staff attendance
- parent notifications
- attendance correction workflow
- immutable audit history
- holiday/calendar integration
- biometric integration

### 5.8 Fees
Support:
- fee structures
- class/year/fee type
- amount
- due date
- generated dues
- discount
- fine
- paid amount
- balance
- status
- payment modes
- transaction ID
- receipt number
- receipt PDF
- daily/monthly reports

Future:
- installment schedules
- concessions/scholarships
- automated overdue status
- payment gateway
- online receipts
- SMS reminders
- reconciliation
- refunds/reversals
- ledger
- fee waivers with approvals

### 5.9 Reporting
Reports must eventually be:
- filterable
- tenant-scoped
- academic-year aware
- exportable
- permission-controlled
- reproducible

Required report groups:
- students
- attendance
- fees
- collections
- payments
- results
- payroll
- expenses
- inventory
- audit logs

### 5.10 Communication
Planned channels:
- in-app notifications
- Firebase push notifications
- SMS
- email
- WhatsApp as an optional premium integration

SMS should primarily be used for high-value messages such as:
- fee due reminders
- urgent school notices
- emergency/closure messages

Routine notifications should prefer push/in-app communication to reduce cost.

---

## 6. Non-Functional Requirements

### Security
- strict tenant isolation
- server-side authorization
- server-side validation
- secure cookies
- password hashing
- rate limiting
- security headers
- audit logging
- least privilege
- secret management
- safe file uploads
- no secrets in source control

### Reliability
- automated database backups
- backup verification
- error handling
- health checks
- monitoring
- graceful shutdown
- retry strategy for external services
- recovery documentation

### Performance
Target initial scale:
- 1 school: ~500 students
- 3–4 schools: ~3,000 students
- future growth: 100+ schools

The system should remain responsive for common CRUD operations with pagination and indexed queries.

### Maintainability
- TypeScript
- shared schemas/types
- modular backend
- reusable UI components
- automated tests
- consistent API conventions
- documented business rules

### Accessibility
- keyboard-friendly forms
- clear focus states
- semantic controls
- sufficient contrast
- responsive layouts
- usable on common school office devices

---

## 7. Success Criteria

A release is considered production-ready only when:

1. Cross-school data access has been tested and blocked.
2. Financial operations are transaction-safe.
3. Authentication/session behavior is tested.
4. Critical workflows have automated tests.
5. Backups and restoration have been tested.
6. External integrations fail gracefully.
7. Audit logs capture sensitive mutations.
8. Files are not stored on ephemeral application disk.
9. No production secrets exist in Git.
10. Deployment, rollback and recovery procedures are documented.

---

## 8. Product Principles

1. **School data is private by default.**
2. **Money operations are never treated as ordinary CRUD.**
3. **The backend is the final authority for permissions.**
4. **Every important action should be traceable.**
5. **Do not add a feature merely because it is technically possible; solve a real school workflow.**
6. **Prefer simple workflows for school staff over technically sophisticated UI.**
7. **Build modules so they can be enabled/disabled per school in the future.**
8. **Do not break existing schools when introducing new academic years or versions.**
9. **Never silently destroy historical data.**
10. **All future AI agents must read this PRD, architecture, rules and memory before changing core behavior.**

---

## Documentation Lifecycle & Versioning

This PRD is a **living document**. It must remain synchronized with the real product and codebase throughout development.

### Status Metadata

- **Document version:** 1.1.0
- **Lifecycle status:** Living / actively maintained
- **Baseline verified:** 11 August 2026
- **Current implementation state:** In development; not production-ready
- **Verification source:** Repository working tree and implemented modules
- **Next mandatory review:** At the completion of every development phase and after any material product-scope change

### What Must Be Updated

Update this PRD whenever any of the following occurs:
- a feature is implemented, removed, deferred, or materially changed
- a user role or workflow changes
- a business rule changes
- pricing, messaging, deployment, or operational assumptions change
- a planned feature is discovered to be technically infeasible or requires redesign
- production feedback changes a requirement

### Completion Rule

A feature is **not considered complete merely because it is listed here**. Completion requires the corresponding implementation, validation/tests, security checks, and phase acceptance criteria. After completion, update the feature status here from planned/in-progress to implemented/verified only after checking the actual codebase.

### Versioning

Use semantic document versions:
- **MAJOR:** product scope, core users, business model, or fundamental requirements change
- **MINOR:** meaningful feature/workflow additions or removals
- **PATCH:** wording corrections, clarification, or status/date corrections without changing requirements

Every version change must add an entry to the changelog at the end of this document.

### AI Synchronization Rule

AI agents must read this document before making product-level decisions. After a material product change, the agent must determine whether this PRD needs an update and make the update in the same task whenever practical. If the implementation and PRD disagree, **the code is the implementation truth** and the PRD must be corrected to reflect the verified state; the intended product decision should then be recorded explicitly.

### Changelog

| Version | Date | Change | Verified By |
|---|---|---|---|
| 1.1.0 | 2026-08-11 | Added living-document lifecycle, verification, and semantic versioning rules. | AI-assisted repository review |
| 1.0.0 | 2026-08-11 | Initial repository-based PRD. | AI-assisted repository review |

