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

Stage 2 now adds `/portal/teacher/workspace?date=YYYY-MM-DD` for the teacher workflow. It returns only the authenticated teacher’s school-scoped profile, class-teacher classes, active students in those classes, sections, date-specific timetable entries assigned to that teacher, and attendance groups for those class-teacher classes. Attendance marking continues through the existing `/attendance` write endpoint, whose backend checks teacher class-teacher ownership and preserves the management-only correction boundary.

The teacher workspace deliberately does not request admin class/academic-year lookup endpoints, so the known `classes:read` / `settings:read` permission mismatch is not worked around by broadening teacher permissions.

Remaining portal API work should add only read models that materially improve student/parent workflows or later teacher assignment-specific workflows:

1. Student dashboard/read models beyond the current dashboard summary.
2. Parent dashboard plus secure child switching state.
3. Teacher subject-assignment-specific student access where a timetable subject assignment is sufficient for a read workflow.
4. Teacher homework workflow once its assignment-scoped lookup requirements are mapped.

## Teacher workspace security decisions

- The workspace route is authenticated and rejects non-teacher roles at the controller boundary.
- Every query is tenant-scoped with the authenticated school ID.
- Teacher identity is resolved from the authenticated user, not a client-supplied teacher ID.
- Timetable entries are selected by the authenticated teacher’s teacher ID and requested day.
- Attendance roster data is limited to the teacher’s `classTeacherOf` classes.
- Attendance writes still pass through the existing attendance authorization and validation path; an existing attendance record cannot be corrected by a teacher.
- No admin lookup permission was added to make the portal render.

## Stage 0/1 acceptance

- Local branch synchronized from GitHub: PASS.
- Client production build after portal foundation: PASS.
- Teacher/student/parent portal home smoke render at 390×844 with mocked authenticated role: PASS.
- Teacher/student/parent desktop navigation smoke render at 1440×900 with mocked authenticated role: PASS.
- Portal UI produced no page errors in those Chromium checks: PASS.
- Existing client Vitest suite remains blocked by inherited `expect is not defined` setup debt in `src/utils/utils.test.ts`; no new test failure was introduced by the portal foundation.

## Stage 2 implementation status

- Teacher workspace backend read model: IMPLEMENTED.
- Teacher workspace responsive UI: IMPLEMENTED.
- Default `/dashboard` now uses the data-driven portal dashboard for Teacher/Student/Parent roles.
- Teacher workspace navigation entry: IMPLEMENTED.
- Local build/browser/API acceptance: PENDING after the current GitHub changes are synchronized locally.
