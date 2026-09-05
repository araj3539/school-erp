# Mobile Release E2E Gate

The release gate exercises the mobile authentication/session contract and one representative portal workflow for Teacher, Student, and Parent.

## Required environment

Run only against a dedicated E2E/staging API and fixture database. Never point this gate at production.

```text
MOBILE_E2E_API_URL=http://localhost:5000/api/v1
MOBILE_E2E_PASSWORD=<same isolated fixture password used by server/e2e>
MOBILE_E2E_SCHOOL_CODE=SCH-E2E-A
```

The mobile gate uses the deterministic fixtures created by `server/scripts/seed-e2e-fixtures.mjs`: `teacher.e2e.a@example.com`, `student.e2e.a1@example.com`, and `parent.e2e.a@example.com`. Their password must come from the isolated E2E secret/configuration; do not commit it.

## Run

```bash
npm run test:e2e:release --prefix mobile
```

The gate verifies login, server-derived role identity, `/auth/me`, role shell resolution, portal dashboard, representative role workspace, refresh-token rotation, and logout for all three portal roles.

A missing E2E environment is an intentional **known skip/blocker**, not a successful release gate. Do not substitute production credentials or a production MongoDB URI to make the test pass.
