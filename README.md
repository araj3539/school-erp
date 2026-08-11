# School ERP

A comprehensive School Management System built with modern web technologies.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT with HttpOnly cookies + Refresh token rotation
- **State Management**: TanStack Query (server) + Zustand (client)
- **Forms**: React Hook Form + Zod validation
- **PDF Generation**: pdfkit
- **File Storage**: Cloudinary
- **Testing**: Vitest + Playwright
- **Monorepo**: Turbo

## Project Structure

```
school-erp/
+-- client/          # React frontend
+-- server/          # Express backend
+-- shared/          # Shared Zod schemas & types
+-- docker-compose.yml
+-- turbo.json
+-- package.json
```

## Features (Phase 1)

- **Authentication & RBAC**: JWT auth, role-based access control
- **Student Management**: Admission, profiles, bulk import/export, ID cards
- **Teacher Management**: Profiles, qualifications, salary, ID cards
- **Class/Section/Subject Management**: Academic structure
- **Attendance**: Bulk marking, calendar view, monthly reports
- **Fee Management**: Fee structures, payment collection, receipts, reports
- **Dashboard**: Stats, charts, recent activity, birthdays
- **Reports**: Student, attendance, fee reports with Excel/PDF export

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Docker (for local MongoDB)

### Installation

```bash
cd school-erp
npm install
npm run db:up
cp .env.example .env
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | JWT signing secret (32+ chars) | Yes |
| JWT_REFRESH_SECRET | Refresh token secret (32+ chars) | Yes |
| CORS_ORIGIN | Frontend URL | Yes |
| CLOUDINARY_* | Cloudinary credentials | No |

### Development

```bash
npm run dev
npm run test
npm run lint
npm run format
```

## Deployment

### Render (Backend)
Build: npm run build, Start: npm start

### Vercel (Frontend)
Framework: Vite, Build: npm run build, Output: dist

### MongoDB Atlas
M0 free tier (512MB)

## Roles & Permissions

| Role | Permissions |
|------|-------------|
| Super Admin | All access |
| Principal | Students, Teachers, Classes, Attendance, Fees, Reports, Settings |
| Accountant | Fees, Payments, Expenses, Salary, Reports |
| Teacher | Attendance (own class), Homework, Marks, Students (own class) |
| Student | View own: Attendance, Homework, Results, Fees |
| Parent | View childs: Attendance, Homework, Results, Fees |

## License

MIT
