# School ERP — Phase 1 Security Audit

Review date: 2026-08-22
Branch: `main`
Phase state: `IN_PROGRESS`

## Verification matrix

| # | Work item | Status | Evidence / remaining work |
|---|---|---|---|
| 1 | Complete tenant-owned endpoint audit | IN_PROGRESS | Core student, teacher, class/section/subject, attendance, fees/payments, dashboard and parent queries are tenant-scoped. Final repository-wide query audit and authenticated runtime matrix remain. |
| 2 | Complete role/permission audit | IN_PROGRESS | Permissions are centralized in `ROLE_PERMISSIONS`; boundary tests verify key role restrictions. School user update payloads now reject tenant reassignment and super-admin promotion. Endpoint-to-permission runtime acceptance remains. |
| 3 | Complete student/teacher ownership | IN_PROGRESS | Student self, teacher assigned-class, and tenant checks exist in core controllers. Final teacher self-profile and live E2E acceptance remain. |
| 4 | Design explicit Parent ↔ Student relationship | IMPLEMENTED | `Student.parentIds` is a same-school active-parent relationship, validated at the model layer; parent portal queries use `schoolId + parentIds`. |
| 5 | Complete document/recovery authorization | IMPLEMENTED | Student, teacher and parent reads are ownership-scoped; recovery records use `schoolId + studentId`; restore is restricted to authorized school-management roles. |
| 6 | Complete AuditLog isolation | IMPLEMENTED | Audit writes inherit tenant context where appropriate and tenant-scoped reads require `schoolId`; isolation tests are present. |
| 7 | Complete session/security verification | IN_PROGRESS | HttpOnly/Secure/SameSite cookies, CSRF checks, rate limits and proxy trust are present. Refresh-token rotation/revocation uses per-user `refreshTokenVersion`; live replay/logout/password-change acceptance remains. |
| 8 | Build cross-tenant integration tests | IMPLEMENTED (HARNESS) | Playwright API E2E harness covers School A/School B isolation. Live execution requires dedicated test credentials/data. |
| 9 | Build role/ownership E2E tests | IMPLEMENTED (HARNESS) | Student, teacher, principal, parent and role-boundary scenarios are defined. Live execution requires dedicated test credentials/data. |
| 10 | Deployment verification | IMPLEMENTED | Render deployment for commit `6da3a623d02ec33d954d618e135a73390cbd2068` was confirmed `live`; subsequent test/CI/runtime-alignment commits are being redeployed automatically. |
| 11 | Synchronize documentation | IN_PROGRESS | This audit, roadmap and financial/authorization notes are being updated as verification advances. |
| 12 | Phase 1 exit verification | NOT READY | Authenticated deployed School A own-data / School B denial matrix plus session replay/revocation verification remain. |

## Production financial safeguards added during Phase 4 hardening

- Payment records are immutable ledger entries; corrections use reversal/refund records.
- Payment collection supports tenant-scoped idempotency keys and unique external transaction IDs.
- Payment reversal/refund is atomic with fee balance correction and produces an audit event.
- Financial reconciliation compares lifetime fee `paidAmount` against gross payments minus reversals and reports fee-level mismatches.
- Reconciliation reports expose optional date-filtered collection summaries separately from all-time ledger integrity so period totals cannot be incorrectly compared with lifetime balances.

## Authorization hardening added during continued Phase 1 audit

- School-user updates are now validated by a dedicated `UpdateTenantUserSchema`.
- Client-supplied `schoolId` is stripped from school-user update payloads.
- School users cannot be promoted to `super_admin` through the user-update API.
- `PUT /auth/users/:id` now validates both the path identifier and update body before reaching the controller.
- User updates now record a before/after audit snapshot and prevent duplicate tenant email addresses.
- Regression tests cover tenant reassignment stripping and super-admin promotion rejection.

## Verification and deployment hardening

- Phase 1 CI now runs on pushes to `main` and pull requests targeting `main`.
- CI builds the monorepo, runs shared and server unit tests, and executes Playwright E2E discovery so the security suite cannot silently disappear from the build.
- Refresh-token replay is covered by the Phase 1 E2E suite.
- Production and CI Node runtime targets are aligned to Node 22 through the root package `engines` declaration.
- The previously observed duplicate `School.code` warning was traced to older startup logs; the current `School` schema contains a single unique index declaration and no database index mutation was performed blindly.

## Deployment failure root causes found and fixed

The Render failures were traced to:

1. `Student.ts` missing the exported `Student` model, breaking Attendance, Fee, Payment and model barrel imports.
2. Parent-assignment strict TypeScript errors.
3. Document-recovery implicit `any` callback typing.
4. Fee-controller callbacks inferred as implicit `any` while the Student model imports were broken.
5. Payment controller tenant-context and `FeeStatus` enum typing errors.
6. Refined Zod schemas being rejected by a middleware typed only for `AnyZodObject`.

The corrected code is now merged to `main` and the production Render deployment returned to `live` after the validation middleware correction; later test/CI/runtime-alignment commits continue through automatic deployment.

## Security decisions now recorded in code

- School users derive tenant context from their authenticated JWT.
- Super admins require an explicit selected school for school-owned operations.
- Client-supplied `schoolId` values are ignored when creating or updating tenant-owned user records.
- School users cannot promote accounts to `super_admin`; platform-level creation remains restricted to the super-admin context.
- Parent access is based on explicit `Student.parentIds`, never on name, phone, class, or admission metadata.
- Student self access is bound to `Student.userId`.
- Teacher access to student records is bound to assigned classes.
- Document recovery keys and records are tenant/student scoped.
- Refresh token rotation is enforced with `refreshTokenVersion`; a used refresh token becomes invalid after successful rotation, and logout/password change revoke refresh sessions.
- Attendance calendar dates are normalized to UTC midnight to avoid local timezone drift.
- Attendance corrections are explicitly audited with before/after record snapshots.
- Payment ledger entries are immutable; reversal/refund is the only correction mechanism.

## Phase 1 exit gate

Do not change Phase 1 to `COMPLETED` until all of the following are verified against the deployed application:

```text
School A -> own student / teacher / attendance / fees / dashboard data: allowed
School A -> School B data: denied
Student -> own record: allowed
Student -> other student: denied
Parent -> linked child: allowed
Parent -> unlinked child: denied
Teacher -> assigned class: allowed
Teacher -> unassigned class: denied
Refresh token replay after rotation: denied
Refresh token after logout/password change: denied
Render build: successful
Vercel frontend deployment: successful
MongoDB Atlas tenant indexes: present
```
