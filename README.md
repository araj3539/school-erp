# School ERP

A multi-tenant School Management System built with React, TypeScript, Express and MongoDB.

## Current status — 2026-09-05

- Phase 1 Production Security and Multi-Tenancy: **COMPLETED**
- Phase 2 Core Administration security/ownership gate: **COMPLETED**
- Phase 3 Attendance + Core Administration completion: **COMPLETED**
- Phase 4 Fees and Financial Core: **COMPLETED**
- Phase 5 Exams and Academic Results: **COMPLETED**
- Phase 6 Homework, Notices and Timetable: **COMPLETED**
- Phase 7 Parent / Student / Teacher Portals: **COMPLETED**
- Phase 8 Mobile App: **IN PROGRESS**

Detailed future execution planning, dependencies, acceptance criteria, evidence and status tracking live in Linear. `phases.md` remains the durable repository roadmap and phase-governance reference.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT with HttpOnly cookies + refresh-token rotation
- **State:** TanStack Query + Zustand
- **Forms/validation:** React Hook Form + Zod
- **PDF:** PDFKit
- **File storage:** Cloudflare R2 with short-lived signed URLs
- **Recovery/backup:** Backblaze B2 + MongoDB backups
- **Excel:** read/write Excel services
- **Testing:** Vitest + Playwright + Testing Library
- **Monorepo:** npm workspaces + Turbo
- **Mobile:** React Native / Expo

## Project Structure

```text
school-erp/
├── client/          # React frontend
├── mobile/          # React Native / Expo mobile app
├── server/          # Express backend, models, services and E2E
├── shared/          # Shared Zod schemas and constants
├── docs/            # Durable supporting documentation only
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Implemented Core Areas

- Authentication and RBAC
- Tenant isolation and ownership enforcement
- Student management and detail pages
- Teacher management
- Classes, sections and subjects
- Attendance marking, correction and bounded bulk attendance
- Student bulk import/export backend workflows
- Fee/payment workflows and receipts
- Dashboard and reports foundation
- School settings and academic years
- Audit logging
- R2 document storage and B2 recovery infrastructure
- Exams and academic results
- Homework, notices and timetable
- Role-specific teacher, student and parent portals
- Mobile application foundation

## Development workflow

Tracked source and documentation changes are made directly on GitHub. Pull them locally before verification.

Use Desktop Commander for local-only work such as:
- running builds/tests/E2E
- inspecting ignored files
- checking local environment variables
- other machine-specific commands

Do not commit local `.env` or machine-specific configuration.

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+
- Docker (optional, for local MongoDB)

### Installation

```bash
cd school-erp
npm install
npm run db:up
cp .env.example .env
npm run dev
```

### Common verification commands

```bash
npm run build
npm run test
npm run lint
npm run test:e2e:phase3 --prefix server
```

E2E commands use the configured E2E environment. Do not commit local credentials.

## Deployment

### Backend
Render-compatible Node service using the repository build/start scripts.

### Frontend
Vercel-compatible Vite build producing `dist`.

### Database
MongoDB Atlas is the intended managed database for the deployed environment.

## File Storage

Student/teacher documents use Cloudflare R2 object keys and short-lived signed URLs. Backblaze B2 is used for recovery/backup copies.

Sensitive documents must never become publicly accessible merely because an object URL is stored in a record. Access must pass authentication, tenant and ownership/role checks first.

## Security principles

- authenticated tenant context is authoritative
- never trust browser-supplied school ownership
- backend authorization is mandatory
- financial history is immutable/auditable
- sensitive mutations create audit events
- validate all external input
- keep secrets out of Git
- preserve Phase 1/Phase 2 regression gates

## Roles

The current permission model includes:

| Role | General scope |
|---|---|
| Super Admin | Platform-level operations with explicit selected-school context where required |
| Principal | School administration and oversight |
| Accountant | Financial operations |
| Teacher | Assigned academic/attendance operations |
| Student | Own records |
| Parent | Linked-child records |

Exact authorization comes from the shared permission definitions and server-side checks; the role table is not a substitute for endpoint authorization.

## Documentation

The durable repository documentation set is intentionally small:

```text
prd.md
architecture.md
rules.md
design.md
phases.md
BACKUP_RESTORE.md
chatgpt-dev-stack-prompt.md
server/e2e/README.md
```

Use Linear as the source of work for detailed planning, sequencing, dependencies, acceptance criteria, implementation status and execution evidence. Keep the durable repository documents synchronized when product, architecture, rules, UX, phase governance, backup/recovery guidance or development protocol changes.

Do not recreate historical phase/audit/implementation-plan files for routine project tracking; record that work in Linear instead.

## License

MIT
