# School ERP — Next Implementation Plan

Updated: 2026-09-03
Production baseline: `main` at `ddf9d1bbb4ed8a3a009d486d3d9fb80af950d35`
Active implementation branch: `phase7-portals`

## Current state

Phase 6 is complete and released to production. `main` remains the protected production baseline. Phase 7 planning is complete and Stage 0 discovery plus the first Stage 1 portal foundation are now implemented on `phase7-portals`.

Discovery is documented in `docs/phase7-discovery.md`. The implementation confirms that the existing backend has useful role-scoped APIs, while several existing frontend pages are admin workflows and must not be reused directly by student/parent users.

## Phase 7 implementation sequence

1. Baseline/discovery and portal API inventory — **COMPLETE**.
2. Shared portal shell, route/permission matrix and reusable portal UI patterns — **IN PROGRESS / foundation complete**.
3. Teacher workspace.
4. Student workspace.
5. Parent workspace with server-authorized child switching.
6. Cross-portal UX/accessibility/responsive consistency pass.
7. Full Phase 1–7 verification.
8. One consolidated release PR and production smoke verification.

## Current implementation

The `phase7-portals` branch currently provides:

- a role-aware authenticated layout;
- dedicated teacher/student/parent portal shell and navigation;
- additive client-side permission route guards;
- role-specific portal home orientation;
- read-only portal student list/detail surfaces so management forms are not exposed to portal users;
- responsive mobile navigation and keyboard skip/focus behavior;
- Stage 0 discovery documentation and frontend design direction.

This is intentionally not yet the complete Teacher, Student or Parent portal. The next coding stage is the Teacher workspace, beginning with assignment-aware data access and dashboard aggregation.

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

## Next implementation task

Build the Teacher workspace. First resolve the known teacher homework academic lookup permission mismatch with a least-privilege assignment-aware read model. Then add the teacher dashboard summary and task-oriented views for timetable, attendance, homework, notices, marks/results and authorized students. Verify assignment and cross-tenant boundaries in API/E2E tests before expanding the teacher UI.
