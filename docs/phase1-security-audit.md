# School ERP — Phase 1 Security Audit

Review date: 2026-08-21
Branch: `phase1-security-hardening`
Phase state: `IN_PROGRESS`

## Verification matrix

| # | Work item | Status | Evidence / remaining work |
|---|---|---|---|
| 1 | Complete tenant-owned endpoint audit | IN_PROGRESS | Core student, teacher, class/section/subject, attendance, fees/payments, dashboard and parent queries are tenant-scoped. A final repository-wide query audit and runtime verification remain. |
| 2 | Complete role/permission audit | IN_PROGRESS | Permissions are centralized in `ROLE_PERMISSIONS`; new tests verify role boundaries. Endpoint-to-permission matrix still needs final runtime verification. |
| 3 | Complete student/teacher ownership | IN_PROGRESS | Student self, teacher assigned-class, and tenant checks exist in core controllers. Teacher self-profile semantics and final E2E acceptance remain. |
| 4 | Design explicit Parent ↔ Student relationship | IMPLEMENTED | `Student.parentIds` is a same-school active-parent relationship, validated at the model layer; parent portal queries use `schoolId + parentIds`. |
| 5 | Complete document/recovery authorization | IMPLEMENTED | Student, teacher and parent reads are ownership-scoped; recovery records use `schoolId + studentId`; restore is limited to authorized school-management roles; recovery snapshots are preserved before replacement/deletion. |
| 6 | Complete AuditLog isolation | IMPLEMENTED | Audit writes inherit the user's school when no school is supplied; tenant-scoped reads always require `schoolId`; isolation tests added. Platform-only audit records may intentionally remain tenantless. |
| 7 | Complete session/security verification | IN PROGRESS | HttpOnly/Secure/SameSite cookies, CSRF checks, rate limits and proxy trust are present. Refresh-token rotation/revocation is now backed by a per-user `refreshTokenVersion`; production runtime verification remains. |
| 8 | Build cross-tenant integration tests | IMPLEMENTED (HARNESS) | Playwright API E2E harness added with explicit School A/School B IDs and tokens. Live execution requires test credentials/data. |
| 9 | Build role/ownership E2E tests | IMPLEMENTED (HARNESS) | Student, teacher, principal, parent and role-boundary scenarios added to the Playwright suite. Live execution requires test credentials/data. |
| 10 | Deployment verification | BLOCKED | Main Render deploys have been failing from TypeScript errors. A feature-branch fix set now addresses the observed compiler failures; deployment must be re-run from `main` after merge. |
| 11 | Synchronize documentation | IN PROGRESS | This audit is now recorded as a living Phase 1 review. `phases.md` remains authoritative for phase state and must stay `IN_PROGRESS` until exit criteria pass. |
| 12 | Phase 1 exit verification | NOT READY | Exit criteria require verified School A own-data access and School A → School B denial across all core modules, plus successful deployment and security/runtime checks. |

## Deployment failure root causes found

The latest Render failures exposed these concrete build problems:

1. `Student.ts` lost its exported `Student` model, which broke imports in Attendance, Fee, Payment and `models/index.ts`.
2. Parent-assignment typing produced strict TypeScript errors.
3. Document-recovery teacher ownership contained an implicit `any` callback parameter.
4. Fee controller callbacks were inferred as implicit `any` during the broken Student model state.

The branch contains fixes for these issues and must be promoted to `main` before Render can verify the repair because the production service tracks `main`.

## Security decisions now recorded in code

- School users derive tenant context from their authenticated JWT.
- Super admins require an explicit selected school for school-owned operations.
- Client-supplied `schoolId` values are ignored when creating tenant-owned records.
- Parent access is based on explicit `Student.parentIds`, never on name, phone, class, or admission metadata.
- Student self access is bound to `Student.userId`.
- Teacher access to student records is bound to assigned classes.
- Document recovery keys and records are tenant/student scoped.
- Refresh token rotation is enforced with `refreshTokenVersion`; a used refresh token becomes invalid after successful rotation, and logout/password change revoke refresh sessions.

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
