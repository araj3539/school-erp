# School ERP — Next Implementation Plan

Updated: 2026-09-03
Production baseline: `main` at `d099331f`
Active planning branch: `phase7-planning`

## Current state

Phase 6 is complete and released to production. Vercel and Render production smoke checks passed after the merge. `main` is now the correct baseline for Phase 7.

Phase 7 planning is complete in `docs/phase7-plan.md` and focuses on role-specific Parent, Student and Teacher portals built on the existing secure ERP APIs and Phase 6 capabilities.

## Phase 7 implementation sequence

1. Baseline/discovery and portal API inventory.
2. Shared portal shell, route/permission matrix and reusable portal UI patterns.
3. Teacher workspace.
4. Student workspace.
5. Parent workspace with server-authorized child switching.
6. Cross-portal UX/accessibility/responsive consistency pass.
7. Full Phase 1–7 verification.
8. One consolidated release PR and production smoke verification.

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

## First implementation task

Start with Stage 0 of `docs/phase7-plan.md`: synchronize local `main`, inspect the actual portal-related backend/frontend implementation, build a role/endpoint permission matrix, and identify only the API gaps that are necessary for a correct portal experience. Do not start visual coding before the role workflows and frontend design direction have been established.
