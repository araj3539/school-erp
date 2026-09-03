# School ERP — Phase 6 Homework Progress

Review date: 2026-09-03
Branch: `phase6-notices`
Phase state: `IN_PROGRESS`

## Implemented in this slice

- shared Zod contracts for homework creation, update and filtered pagination;
- attachment metadata contract with bounded attachment count;
- assigned/due date ordering validation;
- tenant-scoped Homework model with academic/class/section/subject ownership references;
- indexes for school/class/section/date and school/subject/due-date queries;
- authenticated homework list/detail/create/update API routes;
- teacher write authorization based on assigned class or subject;
- student read isolation to the student's class/section, including class-wide homework;
- parent read isolation to explicitly linked active children;
- academic year, class, subject and section ownership validation;
- create/update audit events;
- admin Homework page with class/section/subject/year filters and assignment form;
- Homework navigation and route for roles with homework read permissions.

## Notices slice

- tenant-scoped Notice model with school/class/section audiences;
- publication scheduling and optional expiry window;
- tenant ownership validation for class and section targets;
- recipient isolation for students, linked parents and class-assigned teachers;
- principal/super-admin notice management with audited create/update;
- shared Notice schemas and explicit `notices:read` / `notices:write` RBAC permissions;
- Notices page with audience, priority and scheduling controls;
- Notices navigation and authenticated API routes.

## Verification

```text
Shared build: PASS
Server build: PASS
Client build: PASS
Focused Phase 6 schema tests: PASS (9/9)
```

Client build retains the existing non-blocking Vite warning about `client/src/lib/api.ts` being both dynamically and statically imported. No new TypeScript/build failure was introduced.

The broader shared Vitest setup still has the previously recorded generated-source ESM/CommonJS tooling debt; the focused Phase 6 schema suite is green.

Focused API/E2E authorization and scheduling coverage remains the next verification task before this slice is considered release-ready.

## Next slice

1. Complete focused Notices API/E2E isolation and scheduling coverage.
2. Timetable data model and conflict validation.
3. Teacher/student timetable views.
4. Homework attachment storage integration using the existing document/storage architecture rather than ad-hoc public uploads.
5. Preserve Phase 1–5 regression gates.
