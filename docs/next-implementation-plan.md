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
6. Cross-portal UX/accessibility/responsive consistency pass — **NEXT**.
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
- assignment-scoped teacher homework lookup, reads and creation;
- a self-scoped `/portal/student/workspace` read model aggregating timetable, attendance, homework, published exams/results, fees and notices;
- a responsive Student workspace used by the default `/dashboard` route for students;
- a linked-child-only `/portal/parent/workspace` read model;
- server-authorized parent child switching through an optional `childId` selection hint;
- a responsive Parent workspace showing attendance, fee balance, homework, exams, timetable and notices for the selected child;
- broad generic homework reads remain blocked for teachers so the portal read model remains the only teacher read path;
- Stage 0/1/2 discovery and implementation documentation.

## Parent workspace security contract

The parent workspace does not trust client-selected child IDs. The server requires the authenticated parent ID to exist in the child’s `parentIds` and requires the child to belong to the authenticated school tenant and remain active. An invalid, unlinked or cross-tenant `childId` is rejected before child-specific data is queried. Omitting `childId` selects the first active linked child. The authorized child list is returned by the same server-scoped query and drives the client selector.

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

- Local branch synchronized from `origin/phase7-portals`: PASS.
- Server production build after Parent slice: PASS.
- Client production build after Parent slice: PASS.
- Parent workspace shell smoke at 1440×900, 768×900 and 390×844: PASS; no horizontal overflow observed.
- Authenticated parent API/browser acceptance with real local credentials: **PENDING** because local parent credentials/session are not exposed.
- Local authenticated server startup remains blocked by missing environment variables; no test credential was invented or persisted.

## Next implementation task

Begin the cross-portal consistency pass: review Teacher, Student and Parent navigation, route guards, loading/error/empty states, mobile behavior, keyboard focus, reduced-motion behavior and role leakage. Fix only verified defects, then run the consolidated Phase 1–6 regression gates before final release preparation.
