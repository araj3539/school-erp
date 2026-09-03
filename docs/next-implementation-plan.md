# School ERP — Next Implementation Plan

Updated: 2026-09-03
Production baseline: `main` at `08d27b91`
Active release branch: `phase6-complete`

## Current state

Phase 6 verification is complete on the isolated release branch. The branch contains Homework + private attachments, Notices and Timetable and is ready for one review PR to `main`.

## Phase 6 release gates — complete

- local sync and clean working tree;
- shared/server/client production builds;
- focused Phase 6 schema tests;
- private Homework attachment API/E2E;
- Notices scheduling, targeting, tenant and RBAC E2E;
- Timetable conflict, ownership, visibility and write-boundary E2E;
- consolidated Phase 1–5 acceptance gates;
- authenticated Chromium desktop QA for principal, teacher, student and parent;
- mobile Chromium QA for Phase 6 management dialogs and overflow;
- post-login console/request-failure scan;
- living documentation updated with verification results;
- release branch consolidated to a single commit based on `main`.

## Known non-Phase-6 test debt

The repository still has existing full-unit-suite issues: three shared schema tests fail, four server suites fail during collection/tooling setup, and one client utility suite fails because the Vitest setup does not expose `expect`. These failures pre-date the Phase 6 release work and are not blocking Phase 6 acceptance because all Phase 1–5 acceptance gates and all Phase 6 focused tests pass.

## Release sequence

1. Open exactly one PR from `phase6-complete` to `main`.
2. Review the complete diff, security boundaries, verification evidence and known test debt.
3. Keep `main` and production untouched until approval.
4. Merge once approved; allow the existing `main` auto-deploy pipeline to handle production.
5. After merge, verify Render health and Vercel production smoke behavior.

## Next development phase

After Phase 6 is merged and production smoke verification passes, begin Phase 7 planning from the updated `main` baseline rather than adding more work to the release branch.

## Quota policy

No intermediate Vercel preview deployment was used for this verification cycle. Continue batching coherent work on feature branches and reserve deployment checks for behavior that cannot be validated locally.
