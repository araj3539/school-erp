# School ERP

A multi-tenant School Management System built with React, TypeScript, Express and MongoDB.

## Current status — 2026-09-05

- Phase 1 Production Security and Multi-Tenancy: **COMPLETED**
- Phase 2 Core Administration security/ownership gate: **COMPLETED**
- Phase 7 role-specific web portals: **COMPLETED**
- Phase 8 mobile app foundation and production path: **IN PROGRESS**
- ALO-20 mobile security/E2E/release gate: **IN PROGRESS**

Detailed execution state, acceptance evidence, dependencies, and current work belong in Linear. Do not recreate that execution state as dated repository audit/progress files.

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
- **Mobile:** Expo / React Native
- **Monorepo:** npm workspaces + Turbo

## Project Structure

```text
school-erp/
├── client/          # React frontend
├── server/          # Express backend, models, services and E2E
├── shared/          # Shared Zod schemas and constants
├── mobile/          # Expo / React Native mobile app
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
- Role-specific Teacher, Student and Parent web portals
- Mobile authentication/session architecture
- Typed mobile API/data layer
- Mobile role shells and secure navigation
- Student/Parent mobile portal slices
- Teacher mobile workflow slice
- Mobile accessibility/resilience foundation

## Development workflow

The authoritative engineering workflow is [`chatgpt-engineering-workflow.md`](chatgpt-engineering-workflow.md).

Core rule:

```text
GitHub = source of record for repository source/documentation
Remote Desktop Commander = local execution, inspection and verification
Linear = source of work and acceptance evidence
```

For this project, source code/documentation edits are made directly on GitHub. Use Remote Desktop Commander for local synchronization, ignored/local-only files, dependency installation, builds, tests, E2E, Expo/device checks, and machine-specific diagnostics.

Do not commit local `.env` files, credentials, or machine-specific configuration.

The engineering workflow deliberately avoids unnecessary PRs, duplicate documentation, repeated full test runs, and repeated Vercel preview deployments. Vercel previews are treated as a limited verification resource because free-tier preview deployments can exhaust the deployment quota.

## Getting Started

### Prerequisites

- Node.js 22.x
- npm 10.x
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
npm run test:e2e --prefix server
```

Dedicated E2E credentials must be supplied through the local environment. Never use production credentials as a shortcut for release testing.

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
- preserve earlier security and tenant regression gates

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

Exact authorization comes from shared permission definitions and server-side checks; this table is not a substitute for endpoint authorization.

## Documentation

Durable repository documentation includes:

```text
prd.md
architecture.md
rules.md
design.md
phases.md
BACKUP_RESTORE.md
chatgpt-engineering-workflow.md
server/e2e/README.md
```

Detailed task execution, verification evidence, blockers, and current status belong in Linear rather than a growing collection of dated audit/progress files.

## License

MIT
