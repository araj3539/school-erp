# School ERP — Next Implementation Plan

Updated: 2026-09-04
Production baseline: `main` at release commit `18fff15a1264283210c717a55beeada2d468483e`, with verification-status documentation commits following it.
Active implementation branch: none — Phase 7 implementation is merged to `main` and released to production.

## Current state

Phase 7 implementation is released to production. The remaining work is formal post-release verification, not additional Phase 7 feature implementation. `main` remains the protected production baseline.

## Phase 7 release and verification sequence

1. Baseline/discovery and portal API inventory — **COMPLETE**.
2. Shared portal shell, route/permission matrix and reusable portal UI patterns — **COMPLETE**.
3. Teacher workspace — **COMPLETE**.
4. Student workspace — **COMPLETE**.
5. Parent workspace with server-authorized child switching — **COMPLETE**.
6. Cross-portal UX/accessibility/responsive consistency pass — **IMPLEMENTED AND RELEASED**.
7. Production deployment and authenticated representative portal acceptance — **COMPLETE** for the verified representative workflows below.
8. Consolidated Phase 1–6 regression gates plus final responsive/accessibility acceptance — **IN PROGRESS**.
9. Final verification documentation and Phase 7 completion decision — **PENDING**.

## Release verification completed

- Phase 7 release commit `18fff15a1264283210c717a55beeada2d468483e` merged to `main`.
- Render production deployment for the release reached `live`.
- Render `/health` returned HTTP 200.
- Production `/api/v1/portal/teacher/workspace` returned HTTP 401 without credentials, confirming the released route is deployed and protected.
- Vercel production deployment for the release reached `READY`.
- Authenticated production Chromium representative checks passed:
  - Teacher: login, teacher portal navigation, teacher workspace with assigned Class 8/A roster, homework, timetable, notices, and denial/redirect of the generic exams route.
  - Student: login, dashboard/navigation, results, fees and timetable.
  - Parent: login, parent workspace, attendance, notices and timetable.
- The production Phase 7 parent fixture has one linked child, so true multi-child switching cannot be demonstrated against production data.

## E2E fixture and authentication hardening

Merged after the Phase 7 release as PR #11 (`ac73bb5dc97513dcc61f17a006b282a7c18268ac`):

- `server/scripts/seed-e2e-fixtures.mjs` provides a guarded, idempotent non-production fixture dataset with two tenants, academic years, Class 8/Section A, role users, deterministic students, a two-child parent and a second tenant student for isolation checks.
- `server/e2e/README.md` documents the fixture workflow and the preferred staging/pre-issued-token authentication strategy.
- `npm run seed:e2e` is the standard entry point from `server/`.
- The seeder requires `E2E_FIXTURE_SEED_ENABLED=true` and refuses `NODE_ENV=production`; reset mode deletes only its deterministic IDs.
- Local verification seeded the fixture successfully and the local database query confirmed three fixture students with the two School A children linked to the same parent.
- Production authentication rate limiting was not changed, weakened or bypassed.
- All stale remote development branches were pruned after their work was merged or superseded; only `main` remains as the persistent remote branch.

## Current implementation

The released `main` branch provides:

- a role-aware authenticated layout;
- dedicated teacher/student/parent portal shell and navigation;
- additive client-side permission route guards;
- a server-aggregated `/portal/dashboard` read model for teacher/student/parent orientation;
- dedicated teacher, student and parent workspace read models;
- teacher assignment-scoped academic surfaces;
- student self-scoped academic/fee information;
- parent linked-child-only access with server-authorized child selection;
- dedicated Student/Parent results, fees, timetable, attendance, homework and notices consumption surfaces;
- tenant-scoped portal queries and backend authorization as the security boundary;
- management-route restrictions preventing portal roles from loading broad administrative screens;
- responsive mobile navigation and keyboard skip/focus behavior;
- restored CSRF protection and the existing authentication/rate-limit security controls;
- deterministic non-production E2E fixture seeding and documented pre-issued-token/staging authentication support.

## Mandatory verification matrix

### Regression gates

Run the production/live Phase 1–6 gates sequentially, recording each suite independently:

1. Phase 1 security/auth/tenant gate.
2. Phase 2 security/session gate.
3. Phase 3 attendance gate.
4. Phase 4 finance gate.
5. Phase 5 exams/results gate.
6. Phase 6 homework/notices/timetable gate.

The production authentication rate limiter must remain enabled. Do not disable, weaken or bypass it to make E2E tests pass. Avoid repeated login hammering and reuse authenticated test sessions/tokens where the existing harness supports that safely. Full non-production E2E runs should use the deterministic fixture seeder and staging environment; production acceptance should prefer pre-issued `E2E_*_ACCESS_TOKEN` values.

The Phase 1 live suite achieved **8/8 PASS** after the earlier rate-limit window cleared. The earlier 5/8 result was an incomplete verification run caused by the production authentication limiter, not evidence of a Phase 7 application regression.

### Portal acceptance

Run authenticated Chromium acceptance against the released production frontend/backend pair at:

- 1440×900 desktop
- 768×900 tablet
- 390×844 mobile

Cover:

- Teacher: assigned scope, attendance/homework/timetable/notices and management-route denial.
- Student: self-only dashboard, attendance, homework, results, fees, timetable, notices and profile.
- Parent: linked-child-only dashboard, attendance, homework, results, fees, timetable, notices and profile.
- Parent child switching on Results, Fees, Timetable and Notices using the deterministic non-production fixture where needed.
- Report-card ownership and cross-tenant/cross-user denial.
- Loading, error and empty states.
- Keyboard navigation, visible focus and major workflow accessibility.

Do not mutate production data solely to create a multi-child acceptance fixture. Use the dedicated non-production fixture seeder instead.

## Security and test principles

- Backend authorization remains the security boundary.
- Every portal query remains tenant-scoped.
- Student access is self-only.
- Parent access is limited to linked children.
- Teacher access is limited to assigned/authorized academic scope.
- Do not fetch broad admin datasets and filter them in React.
- Do not weaken production authentication/rate limiting or CSRF protection for tests.
- Use GitHub directly for source/documentation changes. Desktop Commander is reserved for local commands, ignored files, environment inspection and test/browser verification.
- Do not persist test secrets or print credentials into documentation/logs.

## Known inherited technical debt

- broader Vitest setup/fixture issues remain documented from earlier phases;
- one Phase 3 attendance fixture/permission mismatch remains non-blocking;
- dependency audit still reports existing vulnerabilities and must not be addressed with blind `npm audit fix --force`;
- older PRD/architecture/memory documents may contain legacy status claims and should be reconciled only when they affect current verification evidence.

## Current verification status

- Main/local synchronization: PASS; local `main` is clean and aligned with `origin/main` at the latest implementation/documentation commit.
- Shared production build: PASS.
- Server production build: PASS.
- Client production build: PASS.
- Phase 1 live security suite: **8/8 PASS**.
- Render release deployment: PASS.
- Vercel release deployment: PASS.
- Production health check: PASS.
- Production unauthenticated portal route protection: PASS.
- Representative authenticated Teacher/Student/Parent Chromium acceptance: PASS.
- Consolidated Phase 1–6 live regression: PASS, with fixture-dependent skips recorded by the existing suites.
- Deterministic E2E fixture seed/build verification: PASS.
- Full authenticated responsive matrix: **PENDING**.
- Full keyboard/focus/accessibility acceptance: **PENDING**.
- Production multi-child parent switching: **NOT APPLICABLE TO CURRENT PRODUCTION FIXTURE**; covered by the new non-production fixture when the browser acceptance run is executed there.

## Next execution task

1. Run the final authenticated Chromium production acceptance at 1440×900, 768×900 and 390×844 for Teacher, Student and Parent.
2. Perform keyboard/focus/accessibility checks on the major portal workflows.
3. Verify report-card ownership, tenant isolation, student self-scope, parent linked-child scope and teacher assignment scope.
4. Run the multi-child parent switching checks against the deterministic non-production fixture rather than production data.
5. Update `docs/phase7-verification-2026-09-04.md` and `phases.md` with exact results.
6. If every Phase 7 exit criterion is evidenced, change Phase 7 status to **COMPLETED**. Otherwise keep **READY_FOR_VERIFICATION** and document the remaining blocker(s).
