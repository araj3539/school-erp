# E2E fixture and authentication strategy

## Deterministic fixtures

Use `npm run seed:e2e` from `server/` against a dedicated test or staging MongoDB database.

Required environment:

- `E2E_FIXTURE_SEED_ENABLED=true`
- `E2E_FIXTURE_PASSWORD` with at least 12 characters
- `MONGODB_URI` pointing to the test/staging database

Optional:

- `E2E_FIXTURE_RESET=true` removes only the deterministic fixture IDs before reseeding.

The seeder creates two isolated schools, one academic year and Class 8/Section A in each school, a teacher, principal, student users, a parent with **two linked children**, and students in both tenants. The fixed IDs make repeated runs idempotent and give cross-tenant and multi-child tests stable ownership boundaries.

**Safety:** the seeder refuses to run when `NODE_ENV=production` or when the explicit enable flag is absent. Never point it at the production database.

## Authentication and rate limiting

Production authentication rate limiting remains unchanged. The login limiter is intentionally strict, so full E2E suites must not repeatedly log in to production.

Preferred order:

1. Run the full E2E suite against a dedicated staging environment with the normal application rate limiter enabled and a test-only threshold appropriate for parallel CI.
2. For production smoke/acceptance, provide pre-issued access tokens through the existing `E2E_*_ACCESS_TOKEN` environment variables. The gate scripts already pass these through to the individual Playwright suites.
3. Fall back to fixture-password login only when a token is unavailable and the run is deliberately limited.

Do **not** disable, bypass, or weaken production authentication rate limiting to make E2E tests pass.

## Fixture IDs and accounts

The seeder prints the deterministic student IDs after a successful run. The parent fixture is `parent.e2e.a@example.com` and has two linked students, allowing child-switching coverage without modifying production data.
