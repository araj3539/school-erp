# School ERP — Phase 1 Security Audit

Review date: 2026-08-22
Branch: `main`
Phase state: `IN_PROGRESS`

## Verification matrix

| # | Work item | Status | Evidence / remaining work |
|---|---|---|---|
| 1 | Complete tenant-owned endpoint audit | IN_PROGRESS | Core student, teacher, class/section/subject, attendance, fees/payments, dashboard and parent queries are tenant-scoped. Final repository-wide query audit and authenticated runtime matrix remain. |
| 2 | Complete role/permission audit | IN_PROGRESS | Permissions are centralized in `ROLE_PERMISSIONS`; boundary tests verify key role restrictions. Endpoint-to-permission runtime acceptance remains. |
| 3 | Complete student/teacher ownership | IN_PROGRESS | Student self, teacher assigned-class, and tenant checks exist in core controllers. Final teacher self-profile and live E2E acceptance remain. |
| 4 | Design explicit Parent ↔ Student relationship | IMPLEMENTED | `Student.parentIds` is a same-school active-parent relationship, validated at the model layer; parent portal queries use `schoolId + parentIds`. |
| 5 | Complete document/recovery authorization | IMPLEMENTED | Student, teacher and parent reads are ownership-scoped; recovery records use `schoolId + studentId`; restore is restricted to authorized school-management roles. |
| 6 | Complete AuditLog isolation | IMPLEMENTED | Audit writes inherit tenant context where appropriate and tenant-scoped reads require `schoolId`; isolation tests are present. |
| 7 | Complete session/security verification | IN PROGRESS | HttpOnly/Secure/SameSite cookies, CSRF checks, rate limits and proxy trust are present. Refresh-token rotation/revocation uses per-user `refreshTokenVersion`; live replay/logout/password-change acceptance remains. |
| 8 | Build cross-tenant integration tests | IMPLEMENTED (HARNESS) | Playwright API E2E harness covers School A/School B isolation. Live execution requires dedicated test credentials/data. |
| 9 | Build role/ownership E2E tests | IMPLEMENTED (HARNESS) | Student, teacher, principal, parent and role-boundary scenarios are defined. Live execution requires dedicated test credentials/data. |
| 10 | Deployment verification | IMPLEMENTED | Render deployment for commit `4357f9852c5f9d8a337aeb6b7b8a4b0985596a9b` is `live`; Vercel production for the same commit is `READY`. |
| 11 | Synchronize documentation | IN PROGRESS | This audit, roadmap and implementation notes are being updated as verification advances. |
| 12 | Phase 1 exit verification | NOT READY | Authenticated deployed School A own-data / School B denial matrix plus session replay/revocation verification remain. |

## Deployment failure root causes found and fixed

The Render failures were traced to:

1. `Student.ts` missing the exported `Student` model, breaking Attendance, Fee, Payment and model barrel imports.
2. Parent-assignment strict TypeScript errors.
3. Document-recovery implicit `any` callback typing.
4. Fee-controller callbacks inferred as implicit `any` while the Student model imports were broken.

The corrected code is now merged to `main` and the production Render deployment is live.

## Security decisions now recorded in code

- School users derive tenant context from their authenticated JWT.
- Super admins require an explicit selected school for school-owned operations.
- Client-supplied `schoolId` values are ignored when creating tenant-owned records.
- Parent access is based on explicit `Student.parentIds`, never on name, phone, class, or admission metadata.
- Student self access is bound to `Student.userId`.
- Teacher access to student records is bound to assigned classes.
- Document recovery keys and records are tenant/student scoped.
- Refresh token rotation is enforced with `refreshTokenVersion`; a used refresh token becomes invalid after successful rotation, and logout/password change revoke refresh sessions.
- Attendance calendar dates are normalized to UTC midnight to avoid local timezone drift.
- Attendance corrections are explicitly audited with before/after record snapshots.

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
