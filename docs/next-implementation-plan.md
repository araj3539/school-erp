# School ERP — Next Implementation Plan

Updated: 2026-09-05
Production baseline: `main` at Phase 7 release plus final acceptance harness commit `cccd49094514b75f4e560e1d50c2eea4c21901de`.
Active implementation branch: `araj870988/alo-6-phase-8-mobile-app-foundation` for the first Phase 8 slice.

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
2. **Phase 8 — Mobile App: IN PROGRESS**
3. **Phase 9 — Notifications**
4. **Phase 10 — Library, Transport, Inventory and Staff**
5. **Phase 11 — Online Payments**
6. **Phase 12 — SaaS administration/billing**
7. **Phase 13 — Reliability and scale**
8. **Phase 14 — AI and advanced analytics**

`phases.md` is the authoritative phase roadmap. The previous version of this document incorrectly listed Notifications before Mobile; that mismatch is corrected here.

## Phase 8 — Mobile App

Recommended direction: React Native + TypeScript, isolated from the existing React/Vite web workspace while reusing shared API contracts and schemas where practical.

### Initial foundation slice

- dedicated `mobile/` Expo/React Native application;
- TypeScript configuration and reproducible mobile dependency lockfile;
- native stack navigation with typed role routes for Teacher, Student and Parent;
- server-authorized API integration as the security boundary;
- explicit mobile authentication/session design before implementing credential persistence;
- native loading/error/empty/accessibility patterns;
- API, unit and E2E coverage before expanding the mobile surface.

### Current verification

- Expo Doctor: **20/20 checks PASS**.
- TypeScript: **PASS**.
- Android bundle export: **PASS**.
- Expo SDK dependency versions were corrected after local validation exposed an initial React Native/SDK mismatch.

### Next Phase 8 work

1. Decide and document the secure mobile session model compatible with the existing JWT + HTTP-only-cookie web model.
2. Add a minimal authenticated mobile API client without weakening server authorization or tenant isolation.
3. Reuse shared Zod/API contracts where practical.
4. Implement the first authenticated read-only portal workflow for each supported role.
5. Add mobile-specific API/unit/E2E coverage and device/browser acceptance where applicable.
6. Apply the existing design system direction rather than creating a second visual system.

Do not begin push/SMS/email notification providers until the notification domain is explicitly scheduled after Mobile App according to `phases.md`.

## Development rules

- Use GitHub directly for source and documentation changes.
- Use Desktop Commander only for local commands, ignored-file/environment inspection and browser/test verification.
- Keep `main` as the production baseline and use feature branches/PRs for material changes.
- Update living documentation as development progresses.
- Keep Phase 1/2 security gates and the permanent Phase 7 portal acceptance harness as regression gates.
- Do not persist test secrets in the repository.
