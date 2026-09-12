# Database Migration and Index Guardrails

## Required migration sequence

1. Inspect current Atlas collections and indexes.
2. Run duplicate/invariant detection queries as a dry run.
3. Record expected affected-document counts.
4. Add new indexes/constraints in an idempotent migration.
5. Never drop an index until query usage and replacement coverage are verified.
6. Re-run invariant queries after migration.
7. Record the migration revision, verification result, and rollback procedure in Linear.

## Naming

Migration scripts use a stable domain-oriented name, for example `migrateCoreIntegrity.ts`. A migration must be safe to run more than once.

## Production safety

- Production data is read-only during audit/preflight.
- No destructive cleanup is performed from an audit script.
- Unique constraints are added only after duplicate detection is zero.
- Rollback notes must identify whether an index can be removed safely or whether data repair is required.
- Application startup must not silently mutate production data.

## Verification checklist

- [ ] Collection schema/model matches intended invariant.
- [ ] Required tenant-scoped unique indexes exist.
- [ ] No conflicting legacy index remains.
- [ ] Query-serving indexes required by high-volume paths are preserved.
- [ ] Duplicate/invariant query returns zero violations.
- [ ] Migration is idempotent.
- [ ] Rollback procedure is documented.
