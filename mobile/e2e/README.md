# Mobile Release E2E Gate

The release gate exercises the mobile authentication/session contract and one representative portal workflow for Teacher, Student, and Parent.

## Required environment

Run only against a dedicated E2E/staging API and fixture database. Never point this gate at production.

```text
MOBILE_E2E_API_URL=https://<dedicated-e2e-api>/api/v1
MOBILE_E2E_PASSWORD=<deterministic-fixture-password>
MOBILE_E2E_SCHOOL_CODE=SCH-PHASE1-A
```

The fixture identities are the dedicated Phase 1 E2E accounts already used by the server acceptance suite. Their password must come from the isolated E2E secret/configuration; do not commit it.

## Run

```bash
npm run test:e2e:release --prefix mobile
```

The gate verifies login, server-derived role identity, `/auth/me`, role shell resolution, portal dashboard, representative role workspace, refresh-token rotation, and logout for all three portal roles.

A missing E2E environment is an intentional **known skip/blocker**, not a successful release gate. Do not substitute production credentials or a production MongoDB URI to make the test pass.
