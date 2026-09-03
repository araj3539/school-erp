# School ERP — Next Implementation Plan

Updated: 2026-09-03
Production baseline: `main` at `ddf9d1bbb4ed8a3a009d486d3d9fb80af950d35`
Active implementation branch: `phase7-portals`

## Current state

Phase 6 is complete and released to production. `main` remains the protected production baseline. Phase 7 planning is complete and Stage 0 discovery plus the shared portal foundation are implemented on `phase7-portals`.

Discovery is documented in `docs/phase7-discovery.md`. The implementation confirms that the existing backend has useful role-scoped APIs, while several existing frontend pages are admin workflows and must not be reused directly by student/parent users.

## Phase 7 implementation sequence

1. Baseline/discovery and portal API inventory — **COMPLETE**.
2. Shared portal shell, route/permission matrix and reusable portal UI patterns — **FOUNDATION COMPLETE**.
3. Teacher workspace — **COMPLETE** for Today/Timetable/Attendance and assignment-scoped Homework.
4. Student workspace — **NEXT**.
5. Parent workspace with server-authorized child switching.
6. Cross-portal UX/accessibility/responsive consistency pass.
7. Full Phase 1–7 verification.
8. One consolidated release PR and production smoke verification.

## Current implementation

The `phase7-portals` branch currently provides:

- a role-aware authenticated layout;
- dedicated teacher/student/parent portal shell and navigation;
- additive client-side permission route guards;
- a server-aggregated `/portal/dashboard` read model for teacher/student/parent orientation;
- a default role dashboard that uses the data-driven portal dashboard for portal roles;
- read-only portal student list/detail surfaces so management forms are not exposed to portal users;
- responsive mobile navigation and keyboard skip/focus behavior;
- a teacher-specific `/portal/teacher/workspace?date=YYYY-MM-DD` read model;
- a responsive Teacher workspace for assigned class-teacher attendance, active rosters and date-specific teacher timetable;
- a least-privilege `/portal/teacher/homework/options` lookup model derived from the authenticated teacher's class-teacher and subject assignments;
- an assignment-scoped `/portal/teacher/homework` read model;
- teacher homework creation routed through the existing validated, audited homework mutation path;
- a role-aware `/homework` page that selects the teacher workspace for teachers while preserving the existing management/consumption page for other roles;
- broad generic homework reads are blocked for teachers so the portal read model remains the only teacher read path;
- Stage 0/1/2 discovery and implementation documentation.

The Teacher workspace intentionally reuses the existing secure attendance write path rather than creating a parallel attendance mutation. Teachers can mark new attendance only for their `classTeacherOf` classes; existing attendance remains correction-protected by school management.

Teacher Homework follows the same least-privilege principle: lookup options come from the authenticated teacher's own assignments, reads are tenant-scoped and limited to class-teacher or subject scope, and creation is sent through the existing `CreateHomeworkSchema` plus the existing homework service/controller authorization and audit path.

## Phase 7 mandatory principles

- Backend authorization remains the security boundary.
- Every portal query remains tenant-scoped.
- Student access is self-only.
- Parent access is limited to linked children.
- Teacher access is limited to assigned/authorized academic scope.
- Do not fetch broad admin datasets and filter them in React.
- Reuse the existing React/Tailwind primitives and TanStack Query architecture.
- Do not introduce a second UI framework.
- Apply `frontend-design_skill.md` before designing major portal surfaces.
- Verify responsive/accessibility behavior in Chromium at desktop, tablet and 390×844 mobile sizes.
- Keep Phase 1–6 gates mandatory regression checks.

## Delivery policy

Source changes and documentation changes are made directly on GitHub. Desktop Commander is reserved for local-only commands, ignored files, environment inspection and test/browser verification.

Batch coherent work on `phase7-*` feature branches. Avoid intermediate Vercel previews unless local verification cannot answer the question. Consolidate the final branch to one release commit where practical, then open one PR to `main` and merge once approved.

## Known inherited technical debt

- broader Vitest setup/fixture issues remain documented from earlier phases;
- one Phase 3 attendance fixture/permission mismatch remains non-blocking;
- dependency audit still reports existing vulnerabilities and must not be addressed with blind `npm audit fix --force`;
- older PRD/architecture/memory documents contain legacy status claims that must be reconciled against verified implementation during Phase 7 documentation maintenance.

## Verification status

- Local sync from `origin/phase7-portals`: PASS.
- Server production build: PASS.
- Client production build: PASS.
- Teacher workspace API was previously verified authenticated against local MongoDB: PASS.
- Teacher workspace Chromium smoke: PASS at 390×844 and 768×900; 1440×900 re-check was limited by local browser authentication state.
- Teacher homework endpoints require authentication and teacher permissions; unauthenticated access correctly returns `401` in local API smoke checks.
- Full authenticated Teacher Homework API/browser acceptance remains pending because the local environment does not expose `E2E_FIXTURE_PASSWORD`/teacher access token variables. No test credential was invented or persisted.

## Next implementation task

Begin the Student workspace: map the existing self-only attendance/homework/results/fees/timetable APIs, add only missing student read models, then build a task-oriented student portal page with self-scope enforced server-side. Verify it at 1440×900, 768px and 390×844 before moving to secure parent child switching.
