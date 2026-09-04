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
- The current parent fixture has one linked child, so true multi-child switching cannot yet be demonstrated with that fixture.

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
- restored CSRF protection and the existing authentication/rate-limit security controls.

## Mandatory verification matrix

### Regression gates

Run the production/live Phase 1–6 gates sequentially, recording each suite independently:

1. Phase 1 security/auth/tenant gate.
2. Phase 2 security/session gate.
3. Phase 3 attendance gate.
4. Phase 4 finance gate.
5. Phase 5 exams/results gate.
6. Phase 6 homework/notices/timetable gate.

The production authentication rate limiter must remain enabled. Do not disable, weaken or bypass it to make E2E tests pass. Avoid repeated login hammering and reuse authenticated test sessions/tokens where the existing harness supports that safely.

The Phase 1 live suite previously achieved **8/8 PASS** before the later rerun encountered `AUTH_RATE_LIMIT_EXCEEDED` after 5/8 tests. The 5/8 result is therefore an incomplete verification run caused by the production authentication limiter, not evidence of a Phase 7 application regression.

### Portal acceptance

Run authenticated Chromium acceptance against the released production frontend/backend pair at:

- 1440×900 desktop
- 768×900 tablet
- 390×844 mobile

Cover:

- Teacher: assigned scope, attendance/homework/timetable/notices and management-route denial.
- Student: self-only dashboard, attendance, homework, results, fees, timetable, notices and profile.
- Parent: linked-child-only dashboard, attendance, homework, results, fees, timetable, notices and profile.
- Parent child switching on Results, Fees, Timetable and Notices where a multi-child fixture is available.
- Report-card ownership and cross-tenant/cross-user denial.
- Loading, error and empty states.
- Keyboard navigation, visible focus and major workflow accessibility.

If the available fixture set still contains only one linked child, document the multi-child limitation rather than mutating production data solely for acceptance.

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

- Main/local synchronization: PASS; local `main` is clean and aligned with `origin/main` at the latest documentation commit.
- Shared production build: PASS.
- Server production build: PASS.
- Client production build: PASS.
- Phase 1 live security suite: **8/8 PASS** immediately before the later rate-limited rerun.
- Render release deployment: PASS.
- Vercel release deployment: PASS.
- Production health check: PASS.
- Production unauthenticated portal route protection: PASS.
- Representative authenticated Teacher/Student/Parent Chromium acceptance: PASS.
- Consolidated Phase 1–6 live regression: **BLOCKED/INCOMPLETE** on the latest attempt because the production auth limiter returned `AUTH_RATE_LIMIT_EXCEEDED` after 5/8 Phase 1 tests; no further login hammering was performed.
- Full authenticated responsive matrix: **PENDING**.
- Full keyboard/focus/accessibility acceptance: **PENDING**.
- Multi-child parent switching: **PENDING/fixture-limited** until a multi-child fixture is available.

## Next execution task

1. Allow the production auth-rate-limit window to clear; do not modify the limiter.
2. Run Phase 1–6 production regression suites sequentially, minimizing repeated authentication and stopping if the limiter engages again.
3. Re-run authenticated production Chromium at 1440×900, 768×900 and 390×844 for Teacher, Student and Parent.
4. Perform keyboard/focus/accessibility checks on the major portal workflows.
5. Verify report-card ownership, tenant isolation, student self-scope, parent linked-child scope and teacher assignment scope.
6. Check for a safe existing multi-child fixture; if none exists, retain the documented limitation rather than changing production data solely for testing.
7. Update `docs/phase7-verification-2026-09-04.md` and `phases.md` with exact results.
8. If every Phase 7 exit criterion is evidenced, change Phase 7 status to **COMPLETED**. Otherwise keep **READY_FOR_VERIFICATION** and document the remaining blocker(s).
