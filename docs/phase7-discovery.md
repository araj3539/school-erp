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

No new dashboard API was added in Stage 1. The existing endpoints are sufficient to establish the shell and secure role navigation.

The next implementation stages should add only the read models that materially improve portal workflows:

1. Teacher dashboard summary / next-class data, preferably aggregated server-side.
2. Student dashboard summary / next-class, attendance and upcoming homework data.
3. Parent dashboard summary plus secure child switching state.
4. Assignment-aware teacher class/student read model if existing list filtering is not sufficient for the teacher workflow.

Before adding each endpoint, verify whether the existing controller can support the required query without broad client-side filtering or N+1 requests.

## Known permission mismatch to resolve before teacher workflow completion

The existing homework UI can attempt academic-year/class lookup requests for teacher users even though the teacher permission set does not include the corresponding admin lookup permissions. Stage 2 must replace this with an assignment-scoped read model or another least-privilege lookup path. The error must not be hidden by frontend console filtering.

## Stage 0/1 acceptance

- Local branch synchronized from GitHub: PASS.
- Client production build after portal foundation: PASS.
- Teacher/student/parent portal home smoke render at 390×844 with mocked authenticated role: PASS.
- Teacher/student/parent desktop navigation smoke render at 1440×900 with mocked authenticated role: PASS.
- Portal UI produced no page errors in those Chromium checks: PASS.
- Existing client Vitest suite remains blocked by inherited `expect is not defined` setup debt in `src/utils/utils.test.ts`; no new test failure was introduced by the portal foundation.
