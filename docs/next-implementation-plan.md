# School ERP — Next Implementation Plan

Updated: 2026-09-04
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
- Added a dedicated `/portal/results` read model for Student and Parent roles. Student queries resolve from the authenticated user; Parent queries require an actively linked child in the same school. Only published results are returned.
- Hardened the Results read model to populate student metadata before shaping the response, so portal result cards identify the correct student without exposing the raw result document.
- Added a dedicated `/portal-results` consumption page with subject marks, outcome/percentage and report-card access while keeping exam management unavailable to portal roles.
- Added a parent child selector to the Results page and fixed it so the full authorized child list remains available after switching.
- Verified the existing report-card controller performs tenant plus student/linked-child ownership checks before generating a PDF.
- Added a dedicated `/portal/fees` read model for Student and Parent roles. Student queries resolve from the authenticated user; Parent queries require an actively linked child in the same school. The response exposes a consumption-safe fee DTO rather than populated fee documents.
- Added a dedicated `/portal-fees` consumption page with due/paid/balance/overdue summaries and fee records, keeping the management fees screen unavailable to portal roles.
- Added a parent child selector to Fees and fixed it so the full authorized child list remains available after switching.
- Added a dedicated `/portal/timetable` read model for Teacher, Student and Parent roles. Teacher access resolves from the authenticated teacher profile; Student access resolves from the authenticated student and class/section; Parent access resolves only active linked children and optionally one selected child.
- Added a dedicated `/portal-timetable` weekly consumption page with role-appropriate schedule details and parent child switching. The existing management timetable page remains admin-only.
- Fixed timetable child switching so parent responses retain the complete authorized child selector while schedule entries remain scoped to the selected child.
- Added a dedicated `/portal/notices` read model for Teacher, Student and Parent roles. Published, unexpired notices are filtered by tenant and the role's authorized school/class/section audience.
- Added a dedicated `/portal-notices` consumption page with parent child switching, safe notice DTOs, responsive cards, loading/error/empty states and no management controls.
- Added the portal Notices navigation item for all three portal roles behind `notices:read`.
- Added `127.0.0.1` to the development-only CORS loopback allowlist so local Chromium verification can use either loopback hostname without changing production origin policy.

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
- dedicated Student/Parent results, fees and timetable consumption surfaces backed by role-safe server read models;
- parent child selection on Results, Fees and Timetable pages, with authorization retained server-side;
- a dedicated Student/Parent homework consumption surface with private attachment access;
- a dedicated Student/Parent attendance consumption surface backed by a server-side self/linked-child read model;
- a dedicated Teacher/Student/Parent notices consumption surface backed by a server-side tenant/audience read model;
- direct Student/Parent profile actions using the existing server-side ownership checks;
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

- Local branch synchronized from `origin/phase7-portals`: PASS after latest portal changes.
- Shared production build: PASS.
- Server production build: PASS.
- Client production build: PASS.
- Phase 1 live security suite: **8/8 PASS** immediately before auth rate limiting engaged.
- Unauthenticated portal route smoke at 1440×900, 768×900 and 390×844: routes correctly redirect to `/login`.
- The same unauthenticated browser smoke exposed a development loopback CORS gap for `127.0.0.1`; this is now fixed in the development-only origin matcher.
- Authenticated role-specific Chromium acceptance remains **PENDING** because the live test login is currently rate-limited and local authenticated startup is blocked by invalid local JWT secret lengths. No credentials or secrets were changed or persisted.
- Phase 2 gate was attempted after the Phase 1 run but was blocked by the live auth rate limiter (`AUTH_RATE_LIMIT_EXCEEDED`); no repeated login hammering was performed after that response.

## Next implementation task

Complete authenticated Chromium verification once the live auth rate-limit window permits the fixture account, covering Teacher, Student and Parent at 1440×900, 768×900 and 390×844. Validate parent child switching across Results, Fees, Timetable and Notices, student self-scope, teacher assignment scope, management-route denial and report-card ownership. Then run the consolidated Phase 1–6 regression gates, reconcile any failures, consolidate Phase 7 into one release PR, review it, and only then merge to `main`.
