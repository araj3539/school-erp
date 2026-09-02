# School ERP

A multi-tenant School Management System built with React, TypeScript, Express and MongoDB.

## Current status — 2026-09-02

- Phase 1 Production Security and Multi-Tenancy: **COMPLETED**
- Phase 2 Core Administration security/ownership gate: **COMPLETED**
- Phase 3 Attendance + Core Administration completion: **IN PROGRESS**
- Phase 3 API/E2E acceptance currently green for attendance, bulk attendance, student search and student bulk import/export.

See `docs/codebase-audit-2026-09-02.md` and `docs/next-implementation-plan.md` for the current development state and sequence.

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

## Project Structure

```text
school-erp/
├── client/          # React frontend
├── server/          # Express backend, models, services and E2E
├── shared/          # Shared Zod schemas and constants
├── docs/            # Phase/audit/implementation documentation
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

## Phase 3 acceptance

The current Phase 3 gate covers:

```text
Attendance:       4 passed
Bulk attendance:  1 passed
Student search:   1 passed
Student bulk:     1 passed
Phase 3 summary:  PASS
```

This does **not** mean Phase 3 is complete. Remaining work includes attendance UI correctness, attendance spreadsheet workflows, reporting/timezone hardening, student Import/Export UI integration, teacher administration acceptance and admission/admin workflows.

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

The Phase 3 E2E command uses the configured E2E environment. Do not commit its local credentials.

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

Before changing core behavior, inspect:

```text
prd.md
architecture.md
rules.md
design.md
phases.md
memory.md
docs/codebase-audit-2026-09-02.md
docs/next-implementation-plan.md
```

Documentation is living project state and must be synchronized after material changes.

## License

MIT
