# School ERP Engineering Workflow

## Source of truth

- Linear is the planning, execution, traceability, and release-control layer.
- GitHub `main` is the source of truth for application code.
- MongoDB Atlas is the source of truth for production schema/index/data verification.
- Remote Desktop Commander is used only for local/unpushed/ignored files and command execution.
- Context7 is consulted when framework/library behavior needs current documentation.

## Delivery flow

1. Create or update the Linear issue and acceptance criteria.
2. Inspect the current GitHub implementation before changing behavior.
3. Create a branch named from the Linear issue when work requires a PR; emergency fixes may use a controlled direct-main change.
4. Keep controllers HTTP-focused, domain rules reusable, and models responsible for persistence/schema invariants.
5. Add regression tests for changed invariants and security boundaries.
6. For migrations/index changes, run dry-run/verification before production mutation and document rollback.
7. Sync local state from `origin/main` before verification; never treat local ignored files as the code source of truth.
8. Run build, unit/regression, and applicable E2E gates.
9. Record implementation evidence, tests, migration notes, and release status in Linear.
10. Only mark an issue Done when its acceptance criteria are supported by code and verification evidence.

## Definition of Done

- Acceptance criteria are implemented or explicitly deferred with a tracked prerequisite.
- Tenant isolation and authorization are tested for sensitive paths.
- Critical writes are idempotent or transactionally safe where retries/concurrency are possible.
- Production migrations have preflight, verification, and rollback notes.
- Server/client builds pass and relevant regression suites pass.
- Linear contains the implementation and verification evidence.
