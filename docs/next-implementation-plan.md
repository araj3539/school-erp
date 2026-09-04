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

## E2E fixture and authentication hardening

- PR #11 (`ac73bb5dc97513dcc61f17a006b282a7c18268ac`) added the deterministic E2E fixture workflow and authentication guidance.
- The fixture now requires an explicit `E2E_MONGODB_URI`; the application's production `MONGODB_URI` is intentionally rejected by the seeder.
- Local verification confirmed the dedicated fixture database can contain two tenants and a two-child parent without touching production.
- During validation, an earlier version of the seeder was accidentally pointed at the production database because the original guard only checked `NODE_ENV`. The deterministic fixture records were immediately removed by exact ID and a follow-up production database check confirmed **0 fixture users, 0 fixture schools and 0 fixture students remain**. The seeder safety guard was then strengthened to require `E2E_MONGODB_URI` explicitly.
- Production authentication rate limiting was never changed, weakened or bypassed.
- All stale remote development branches were pruned; only `main` remains remotely. Local stale branches were also removed.

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

The live Phase 1–6 regression gates are green and must remain regression gates for Phase 7.

The production authentication rate limiter must remain enabled. Do not disable, weaken or bypass it to make E2E tests pass. Avoid repeated login hammering and reuse authenticated test sessions/tokens where the existing harness supports that safely. Full non-production E2E runs should use the deterministic fixture seeder and staging environment; production acceptance should prefer pre-issued `E2E_*_ACCESS_TOKEN` values.

### Portal acceptance

Run authenticated Chromium acceptance against the released production frontend/backend pair at:

- 1440×900 desktop
- 768×900 tablet
- 390×844 mobile

Cover teacher assigned scope and denial boundaries; student self-only information; parent linked-child-only information; child switching; ownership/tenant isolation; loading/error/empty states; keyboard/focus; and accessibility.

Do not mutate production data solely to create a multi-child acceptance fixture. Use the dedicated non-production fixture database.

## Final acceptance attempts — 2026-09-04

- A token-based production Chromium matrix was added for verification so production login rate limiting would not be hammered.
- Existing pre-issued production tokens were accepted by the API: direct authenticated requests to `/api/v1/portal/timetable` returned HTTP 200 for Teacher, Student and Parent.
- The browser matrix could not be certified because the browser session did not retain authentication consistently across all portal navigations: Student/Parent reached `/login` when opening `/portal-timetable`, while the direct authenticated API calls remained healthy. The Teacher matrix also reached `/login` during the later navigation sequence.
- The keyboard probe returned zero visible focus targets on the Teacher desktop workflow. This is not sufficient evidence to call the application inaccessible, because the same browser harness was already losing authenticated state during the matrix.
- No production code or authentication configuration was changed in response to these test-harness failures.

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

## Current verification status

- Main/local synchronization: PASS; local `main` is clean and aligned with `origin/main`.
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
- Deterministic E2E fixture seed/build verification: PASS; production fixture cleanup verification: PASS.
- Production token-based portal API check: PASS for timetable across Teacher/Student/Parent.
- Full authenticated responsive matrix: **BLOCKED BY BROWSER AUTH-STATE PERSISTENCE IN THE VERIFICATION HARNESS**.
- Full keyboard/focus/accessibility acceptance: **PENDING**.
- Production multi-child parent switching: **PENDING**; requires browser acceptance against the dedicated non-production fixture.

## Next execution task

1. Fix the verification harness authentication-state setup without changing application authentication behavior; prefer a Playwright browser context that authenticates once through the actual frontend/API cookie flow or uses a supported authenticated storage state.
2. Re-run Teacher, Student and Parent at 1440×900, 768×900 and 390×844.
3. Perform keyboard/focus/accessibility checks after authenticated state is stable.
4. Verify report-card ownership, tenant isolation, student self-scope, parent linked-child scope and teacher assignment scope.
5. Run multi-child parent switching against the dedicated E2E fixture database.
6. Update `docs/phase7-verification-2026-09-04.md` and `phases.md` with exact final results.
7. Only then change Phase 7 to **COMPLETED** if every exit criterion is evidenced.
