# School ERP — Phase 6 Homework Progress

Review date: 2026-09-03
Branch: `ui-refresh-legacy-merge`
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

## Verification

```text
Shared build: PASS
Server build: PASS
Client build: PASS
```

The repository's existing shared Vitest setup currently has a generated-source ESM/CommonJS mismatch in tracked `src/**/*.js` artifacts. That causes the broader shared test command to fail before several schema suites can execute; this is recorded as existing test-tooling debt and is not treated as a Phase 6 feature pass.

## Next slice

1. Notices with tenant/RBAC boundaries and publication scheduling.
2. Timetable data model and conflict validation.
3. Teacher/student timetable views.
4. Homework attachment storage integration using the existing document/storage architecture rather than ad-hoc public uploads.
5. Focused API/E2E coverage for homework, notices and timetable.
