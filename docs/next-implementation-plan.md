# School ERP — Next Implementation Plan

Updated: 2026-09-03
Production baseline: `main` at `ddf9d1bbb4ed8a3a009d486d3d9fb80af950d35`
Active implementation branch: `phase7-portals`

## Current state

Phase 6 is complete and released to production. `main` remains the protected production baseline. Phase 7 planning is complete and the portal foundation plus Teacher, Student and Parent workspace slices are implemented on `phase7-portals`.

## Phase 7 implementation sequence

1. Baseline/discovery and portal API inventory — **COMPLETE**.
2. Shared portal shell, route/permission matrix and reusable portal UI patterns — **FOUNDATION COMPLETE**.
3. Teacher workspace — **COMPLETE** for Today/Timetable/Attendance and assignment-scoped Homework.
4. Student workspace — **COMPLETE** for the self-scoped school-day workspace.
5. Parent workspace with server-authorized child switching — **COMPLETE**.
6. Cross-portal UX/accessibility/responsive consistency pass — **IN PROGRESS**.
7. Full Phase 1–7 verification.
8. One consolidated release PR and production smoke verification.

## Consistency pass completed so far

- Added explicit role guards to Teacher, Student and Parent workspace routes.
- Added an explicit portal-role guard to `/portal-dashboard` so administrative roles cannot open the portal dashboard directly.
- Restricted management-shaped Attendance, Exams, Notices, Timetable and Fees routes to Principal, Accountant and Super Admin roles. Portal roles must use their dedicated workspaces instead of loading broad management screens.
- Removed those management-shaped destinations from portal navigation so users are not offered links that the portal route policy intentionally rejects.
- Kept Teacher Students navigation because its role-specific page uses the existing tenant/assignment-scoped student read path.
- Preserved the dedicated role-aware Homework route because Teacher, Student and Parent each have a role-appropriate read/write surface there.
- Replaced the generic management-oriented homework screen for Student and Parent roles with a dedicated consumption view. It uses the existing server-scoped `/homework` read path and private signed attachment URL flow without exposing write controls.
- Added direct profile actions from Student and Parent workspaces to the existing server-authorized student detail surface.
- Added a dedicated `/portal/attendance` read model for Student and Parent roles. Student queries resolve only from the authenticated user; Parent queries require the selected child to be actively linked in the same school.
- Added a dedicated `/portal-attendance` consumption page showing a 30-day rate, status counts and daily attendance records, keeping the management attendance screen unavailable to portal roles.

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
- assignment-scoped teacher homework lookup, reads and creation;
- a self-scoped `/portal/student/workspace` read model aggregating timetable, attendance, homework, published exams/results, fees and notices;
- a responsive Student workspace used by the default `/dashboard` route for students;
- a linked-child-only `/portal/parent/workspace` read model;
- server-authorized parent child switching through an optional `childId` selection hint;
- a responsive Parent workspace showing attendance, fee balance, homework, exams, timetable and notices for the selected child;
- a dedicated Student/Parent homework consumption surface with private attachment access;
- direct Student/Parent profile actions using the existing server-side ownership checks;
- a dedicated Student/Parent attendance consumption surface backed by a server-side self/linked-child read model;
- broad generic homework reads remain blocked for teachers so the portal read model remains the only teacher read path.

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

- Local branch synchronized from `origin/phase7-portals`: PASS before this slice.
- Server production build after portal consistency changes: PASS before this slice; re-run after attendance implementation.
- Client production build after portal consistency changes: PASS before this slice; re-run after attendance implementation.
- Portal shell smoke at 1440×900, 768×900 and 390×844: PASS before this slice; attendance page still needs viewport QA.
- Authenticated role-specific route/API acceptance: PENDING for real Teacher/Student/Parent credentials because local sessions are not exposed.
- Local authenticated server startup remains blocked by invalid local JWT secret lengths; no secrets were changed or persisted.
- The latest unauthenticated local startup failure is an environment configuration issue, not evidence of a portal authentication failure.

## Next implementation task

Continue the consistency pass with role-specific results and fees consumption surfaces, then run authenticated Chromium checks where a real session is available and execute the consolidated Phase 1–6 regression gates. Do not merge to `main` until the full Phase 7 verification matrix is green or every remaining limitation is explicitly documented.
