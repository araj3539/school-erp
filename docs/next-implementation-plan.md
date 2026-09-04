# School ERP — Next Implementation Plan

Updated: 2026-09-04
Production baseline: `main` at Phase 7 release plus final acceptance harness commit `cccd49094514b75f4e560e1d50c2eea4c21901de`.
Active implementation branch: none.

## Current state

Phase 7 — Parent/Student/Teacher Portals is **COMPLETED**. The portal implementation is released to production, the final authenticated responsive browser matrix is passing, ownership/tenant boundaries are verified against the dedicated E2E fixture, and Phase 1–6 regression gates remain green.

## Phase 7 completion evidence

1. Teacher core daily academic workflows — **PASS**.
2. Student self-only academic/fee visibility — **PASS**.
3. Parent linked-child-only access and child switching — **PASS**.
4. Cross-tenant isolation — **PASS**.
5. Phase 1–6 regression gates — **PASS**.
6. Critical API/E2E and authenticated Chromium coverage — **PASS**.
7. Desktop/tablet/mobile behavior — **PASS** at 1440×900, 768×900 and 390×844.
8. Keyboard/focus acceptance — **PASS**.
9. Consistent portal visual/design-system direction — **PASS**.
10. Production build/deployment/smoke verification — **PASS**.

## Verification artifacts

- Final acceptance PR #12 merged as `cccd49094514b75f4e560e1d50c2eea4c21901de`.
- `server/e2e/phase7-final-verification.spec.ts`: local 5/5 PASS.
- `server/e2e/phase7-production-responsive.spec.ts`: production 3/3 PASS.
- `docs/phase7-verification-2026-09-04.md`: final evidence and completion decision.
- Deterministic E2E fixtures remain isolated through explicit `E2E_MONGODB_URI`.

## Security baseline

- Backend authorization remains the security boundary.
- Tenant isolation remains enforced server-side.
- Student access is self-only.
- Parent access is limited to linked children.
- Teacher access is limited to assigned/authorized academic scope.
- CSRF protection remains enabled.
- Production authentication rate limiting remains enabled.
- Tests must not weaken or bypass production security controls.

## Current implementation order

1. **Phase 7 — Parent/Student/Teacher portals: COMPLETED**
2. **Phase 8 — Notifications**
3. **Phase 9 — Mobile App**
4. **Phase 10 — Library, Transport, Inventory and Staff**
5. **Phase 11 — Online Payments**
6. **Phase 12 — SaaS administration/billing**
7. **Phase 13 — Reliability and scale**
8. **Phase 14 — AI and advanced analytics**

The phase numbering in `phases.md` remains the authoritative roadmap; implementation should follow the documented gates and scope rather than adding speculative features.

## Phase 8 preparation — Notifications

Recommended next work:

- inventory business events that genuinely require notifications;
- define a provider-agnostic `NotificationService` contract;
- implement durable in-app notification records first;
- define delivery state, retries and failure handling;
- preserve tenant isolation and auditability;
- keep external SMS/email/push providers behind adapters;
- ensure provider failure cannot break core ERP transactions;
- add API, unit and E2E regression coverage before provider integration.

Do not begin broad provider integrations until the notification domain model and failure semantics are settled.

## Development rules

- Use GitHub directly for source and documentation changes.
- Use Desktop Commander only for local commands, ignored-file/environment inspection and browser/test verification.
- Keep `main` as the production baseline and use feature branches/PRs for material changes.
- Update living documentation as development progresses.
- Keep Phase 1/2 security gates and the permanent Phase 7 portal acceptance harness as regression gates.
- Do not persist test secrets in the repository.
