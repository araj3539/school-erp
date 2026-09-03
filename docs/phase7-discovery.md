# Phase 7 — Stage 0 Discovery

Updated: 2026-09-03
Branch: `phase7-portals`

## Baseline

- Production baseline: `main` after Phase 6 plus `frontend-design_skill.md`.
- Local repository was synchronized from GitHub before implementation.
- No local unpushed source changes were carried into this branch.
- Phase 7 planning remains preserved on `phase7-planning`.

## Existing role permissions

| Role | Existing portal-relevant permissions |
|---|---|
| Teacher | `attendance:read/write`, `homework:read/write`, `marks:read/write`, `students:read`, `notices:read`, `timetable:read:own` |
| Student | `students:read:own`, `attendance:read:own`, `homework:read:own`, `marks:read:own`, `fees:read:own`, `payments:read:own`, `notices:read`, `results:read:own`, `timetable:read:own` |
| Parent | `students:read:child`, `attendance:read:child`, `homework:read:child`, `marks:read:child`, `fees:read:child`, `payments:read:child`, `notices:read`, `results:read:child`, `timetable:read:child` |

The role matrix is defined centrally in `shared/src/constants/index.ts`. The portal must not broaden these permissions merely to make a screen render.

## Existing secure API surface

- Students: tenant-scoped list/detail endpoints already support student self access, parent linked-child access, and teacher-scoped reads.
- Attendance: list and student-history endpoints exist; teacher access is restricted to assigned class-teacher scope; student/parent ownership checks exist for student history.
- Homework: list/detail and private attachment URL endpoints already support own/child reads; teacher writes are additionally assignment/subject scoped.
- Notices: recipient targeting already derives student/parent visibility from school/class/section relationships.
- Timetable: tenant-scoped read API already exists with role-aware access logic.
- Exams/results: read APIs already accept own/child permissions and teacher marks access is assignment/subject constrained.
- Fees/payments: student/parent read APIs already have ownership middleware.
- Parent child list/detail: dedicated parent student access controller already enforces `parentIds` plus tenant scope.

## Important discovery: admin pages are not portal pages

Several existing pages are management-oriented. `StudentsPage`, for example, includes create/edit/import/export actions and therefore must not simply be exposed to student/parent users. Phase 7 introduces read-only portal student screens instead of weakening those existing pages.

Likewise, document recovery remains an administrator workflow. Portal roles are not granted access to recovery management routes.

## Stage 1 architecture decision

Authenticated routing now uses one role-aware layout:

```text
RequireAuth
   |
RoleAwareLayout
   +-- Principal / Accountant / Super Admin -> existing AdminLayout
   |
   +-- Teacher / Student / Parent -> PortalLayout
```

The portal shell provides permission-derived navigation, responsive mobile navigation, sign-out, skip-link/focus support, and a dedicated portal home. Client-side route guards are additive UX protection; backend authorization remains authoritative.

## Frontend design direction

The portal audience is a teacher, student or parent trying to complete a small number of school-day tasks quickly. The single job of the home screen is therefore orientation and fast task entry, not administration.

Direction:

- Palette: retain the existing neutral school-operations base while using the existing primary color as the action accent; use slate surfaces for stronger hierarchy rather than adding a second visual theme.
- Type: keep the existing product typography foundation and create personality through restrained weight, tracking and hierarchy instead of introducing a new font dependency.
- Layout: quiet navigation rail on desktop, compact header, wide task surface, stacked cards on mobile.
- Signature: a dark orientation panel at the top of portal home with role-specific language and a small geometric accent; the rest of the page stays disciplined.
- Content: task labels use user language such as “Attendance”, “Homework” and “Timetable”, not backend terminology.

This follows `frontend-design_skill.md` while evolving `design.md` rather than creating a separate design system.

## API gaps identified

Stage 1 added the aggregated `/portal/dashboard` read model for teacher, student and parent orientation.

Stage 2 added `/portal/teacher/workspace?date=YYYY-MM-DD` for the teacher workflow. It returns only the authenticated teacher’s school-scoped profile, class-teacher classes, active students in those classes, sections, date-specific timetable entries assigned to that teacher, and attendance groups for those class-teacher classes. Attendance marking continues through the existing `/attendance` write endpoint, whose backend checks teacher class-teacher ownership and preserves the management-only correction boundary.

Teacher homework then added assignment-scoped lookup/read/creation models under `/portal/teacher/homework*`, and broad generic homework reads remain blocked for teachers.

Student workspace adds `/portal/student/workspace` because the existing individual APIs were secure but would require several client round trips and exposed management-shaped responses. The new model resolves the student from `req.user.userId` plus the tenant, then aggregates only that student’s timetable, recent attendance, upcoming homework, published exams/results, current academic-year fees and applicable notices. No student ID is accepted from the client.

Parent workspace adds `/portal/parent/workspace` as a server-aggregated, linked-child-only read model. It accepts an optional `childId` solely as a selection hint; the backend re-resolves that ID against the authenticated parent’s `parentIds` relationship and school tenant. An unlinked, cross-tenant or inactive child is rejected. With no child ID, the first active linked child is selected. The response aggregates only that selected child’s timetable, attendance, homework, published exams, fees and applicable notices and also returns the authorized child list for switching.

## Parent workspace security decisions

- Parent workspace requires the existing child-read permissions; no new permission is introduced.
- Parent identity comes only from the authenticated user.
- Every child lookup requires both the authenticated parent ID in `parentIds` and the authenticated school tenant.
- `childId` is never trusted as authorization; it is re-validated server-side before any child data query runs.
- No-child accounts return an explicit empty state rather than broad student data.
- Child switching is represented by a URL query parameter for shareable state, but the parameter cannot bypass server ownership checks.
- Parent navigation does not expose teacher/admin management workflows.

## Student workspace security decisions

- The workspace route requires the student’s existing own-read permissions and rejects non-student roles.
- Student identity is resolved only from the authenticated user and tenant.
- Timetable, homework and notices are restricted to the student’s current class/section.
- Attendance is restricted to records containing the authenticated student.
- Exams are limited to the current academic year, student class and published status.
- Results are limited to the authenticated student and published status.
- Fees are limited to the authenticated student and current academic year.
- No student ID, class ID or fee/result filter is accepted for the workspace aggregation.

## Verification status

- Local branch synchronized from GitHub: PASS.
- Server production build after Parent implementation: PASS.
- Client production build after Parent implementation: PASS.
- Parent workspace browser shell smoke: PASS for responsive page loading at 390×844, 768×900 and 1440×900; no horizontal overflow observed.
- Authenticated parent API/browser acceptance: PENDING because local parent credentials/session are not exposed.
- Local authenticated server startup remains blocked by missing environment variables; no test credential was invented or persisted.
