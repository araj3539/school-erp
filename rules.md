# School ERP — Engineering Rules

> **This file is the mandatory engineering rulebook for humans and AI coding agents.**
> If a requested change conflicts with these rules, stop and resolve the conflict before coding.

---

## 1. Source-of-Truth Order

When deciding what the system should do, use this order:

1. `prd.md` — product intent and scope
2. `architecture.md` — technical structure
3. `rules.md` — non-negotiable engineering constraints
4. `design.md` — UX/UI behavior
5. `phases.md` — delivery sequencing
6. `memory.md` — current implementation/context
7. Existing code — current implementation detail

If code conflicts with the documented intended architecture, do not silently change the architecture. Identify the mismatch and fix it deliberately.

---

## 2. Never Break Tenant Isolation

Every school-owned record is tenant data.

For an authenticated school user:

```text
req.user.schoolId
```

is authoritative.

Never accept:

```text
schoolId
```

from the browser as an authorization decision.

Allowed:

```ts
Student.findOne({
  _id: studentId,
  schoolId: req.user.schoolId
})
```

Forbidden:

```ts
Student.findById(studentId)
```

when the resource belongs to a school.

This applies to:
- reads
- updates
- deletes
- exports
- reports
- file access
- PDF generation
- notifications
- background jobs
- search
- aggregations

---

## 3. Tenant Scope Must Exist in Background Jobs

Do not assume `req.user` exists in:
- cron jobs
- queue workers
- SMS jobs
- report jobs
- notification workers

Every job payload must contain an explicit tenant identifier and the worker must validate it.

---

## 4. Authorization Rules

Backend authorization is mandatory.

Frontend permission checks are only for:
- hiding buttons
- navigation
- improving UX

Never rely on frontend authorization.

Every sensitive endpoint should have:

```text
authenticate
+
permission check
+
tenant scope
+
resource ownership/business authorization
```

---

## 5. Never Trust Client Ownership Fields

If a request contains:

```json
{
  "schoolId": "..."
}
```

the backend must not use that value to authorize access.

Derive ownership from:
- authenticated user
- trusted server context
- existing resource relationship

---

## 6. Validation

All external input must be validated.

Validate:
- body
- params
- query
- uploaded files
- webhook payloads
- external API responses where practical

Use Zod where appropriate.

Frontend validation does not replace backend validation.

---

## 7. Money Rules

All financial operations must be deterministic and auditable.

Never:
- use floating-point arithmetic carelessly
- allow negative balances
- accept payment greater than balance
- silently change a historical payment
- delete financial history permanently
- create duplicate receipts
- update payment and fee independently without transaction safety

Prefer integer minor units for new financial designs if practical, e.g.:

```text
₹125.50 -> 12550 paise
```

If the current model remains numeric rupees, centralize rounding and calculation rules.

---

## 8. Payment Immutability

A completed payment should not be edited like a normal CRUD record.

Corrections should use:
- reversal
- refund
- adjustment
- correction record

with an audit trail.

Never mutate historical financial facts without recording why.

---

## 9. Audit Everything Important

Create audit events for:
- login/logout where appropriate
- user changes
- student creation/update/deletion
- teacher changes
- fee structure changes
- fee generation
- payment collection
- payment reversal/refund
- attendance corrections
- marks changes
- settings changes
- document deletion
- permission/role changes

Audit logs should contain enough information to reconstruct who did what and when.

Do not store secrets in audit logs.

---

## 10. Soft Delete by Default

For operational entities, prefer status/deactivation over destructive deletion.

Examples:
- student -> LEFT/TRANSFERRED/GRADUATED
- teacher -> INACTIVE
- user -> inactive
- school -> inactive

Hard deletion should be exceptional and protected.

Financial and audit records should normally be immutable rather than deleted.

---

## 11. Academic Year Isolation

Academic data must be tied to an academic year where appropriate.

Never assume:

```text
current year = only year
```

Historical data must remain queryable.

Only one current year should be active per school.

Year rollover must not overwrite historical records.

---

## 12. Authentication Security

Never:
- store passwords
- log passwords
- return password hashes
- expose refresh tokens to JavaScript unnecessarily
- put secrets in Git

Use:
- bcrypt/strong password hashing
- HTTP-only cookies
- secure production cookies
- short access-token lifetime
- refresh-token protection
- rate limiting
- account status checks

---

## 13. Environment Variables

Never commit:
- `.env`
- `.env.local`
- production secrets
- API keys
- database passwords

Commit:

```text
.env.example
```

with placeholders only.

---

## 14. File Upload Rules

Every uploaded file must be:
- authenticated
- authorized
- size limited
- type validated
- stored outside ephemeral application disk
- associated with a tenant
- safely named
- deletable through an authorized server operation

Do not trust:
- filename
- extension
- MIME type supplied by the browser

Validate actual content where security requires it.

---

## 15. PDFs

PDF generation belongs on the server for authoritative documents.

PDFs must:
- use tenant school data
- use current configuration/branding
- never hardcode another school
- have stable document identifiers
- be generated from trusted database records

Do not let the client decide the final amount, receipt number, or financial state shown on an official receipt.

---

## 16. SMS/External Messaging

SMS is a paid external side effect.

Never send SMS directly inside a database transaction.

Preferred:

```text
business event
  -> outbox/job
  -> SMS worker
  -> provider
  -> delivery result
```

Use idempotency so retries do not send duplicate messages unnecessarily.

Recommended default:
- fee due reminders
- urgent notices

Routine updates should prefer push/in-app notifications.

---

## 17. API Rules

Use consistent:
- HTTP status codes
- JSON response shape
- pagination
- validation errors
- error codes

Do not expose raw stack traces in production.

Do not return database internals unnecessarily.

---

## 18. Controller Rules

Controllers should be thin.

Bad:

```text
controller:
  500 lines of business logic
```

Good:

```text
controller
  -> validate
  -> call service
  -> map result to HTTP response
```

Business logic belongs in services/domain functions.

---

## 19. Database Rules

Every important query must use indexes appropriate to its filters.

Common tenant index pattern:

```text
{ schoolId: 1, ...frequentFilter: 1 }
```

Use compound indexes based on actual query patterns.

Do not create indexes blindly.

For list endpoints:
- paginate
- cap page size
- avoid unbounded queries

---

## 20. No N+1 Queries

Avoid:

```text
for each student:
    query attendance
```

Prefer:
- batch queries
- aggregation
- populate where appropriate
- precomputed summaries when justified

---

## 21. React Rules

Use:
- TanStack Query for server state
- Zustand for client-only global state
- React Hook Form for forms
- reusable UI components

Do not duplicate server entities in multiple state stores.

Do not put business-critical financial calculations only in React.

---

## 22. Shared Package Rules

Shared package should contain:
- enums
- constants
- Zod schemas
- DTO types
- pure utilities

Do not put:
- Express request objects
- Mongoose models
- browser-only APIs
- server secrets

in shared code.

Avoid duplicated permission definitions between client and server.

---

## 23. Testing Rules

Every bug fix should add a regression test when practical.

Critical business logic requires unit tests.

Critical user journeys require E2E tests.

Minimum high-value E2E set:
- login
- role restriction
- student creation
- attendance
- fee generation
- payment collection
- receipt
- tenant isolation

---

## 24. No Feature Without Tenant Tests

Any new tenant-owned feature must include a test proving:

```text
School A cannot read School B data.
School A cannot modify School B data.
School A cannot delete School B data.
```

This is mandatory for production features.

---

## 25. Error Handling

Use typed/application errors.

Do not:

```ts
catch (e) {
  console.log(e)
}
```

and continue as if success occurred.

Errors must:
- be handled centrally
- have safe client messages
- preserve useful server diagnostics
- have appropriate status codes

---

## 26. External Services Must Be Optional

The core ERP must not become unusable because:
- SMS provider is down
- Cloudinary is down
- email provider is down
- AI provider is down
- payment gateway is down

Use queues/retries/fallbacks where appropriate.

---

## 27. No Hardcoded School Data

Forbidden in production code:

```text
School Name
School Address
School Phone
School Logo URL
```

Use tenant settings/configuration.

The current PDF implementation contains placeholders and must be corrected.

---

## 28. No Premature Microservices

Keep a modular monolith until there is a demonstrated operational reason to split services.

Preferred first architecture:

```text
one frontend
one API
one database
optional worker
optional Redis
```

---

## 29. Backward Compatibility

Do not rename API fields or database fields casually.

If a breaking change is required:
1. document it
2. migrate data
3. update clients
4. test old/new behavior if needed
5. deploy deliberately

---

## 30. AI Agent Rules

Before changing code, an AI coding agent must:

1. Read `prd.md`.
2. Read `architecture.md`.
3. Read `rules.md`.
4. Read `design.md`.
5. Read `phases.md`.
6. Read `memory.md`.
7. Inspect the relevant existing code.
8. State the intended files to change.
9. Preserve existing behavior unless the task explicitly changes it.
10. Avoid unrelated refactors.
11. Add/update tests for behavior changes.
12. Update documentation if architecture or behavior changes.

Never invent an API, model, field, route, permission, or dependency when an existing convention should be reused.

---

## 31. Definition of Done

A feature is not done when the UI works.

It is done when:
- frontend works
- backend works
- validation exists
- authorization exists
- tenant isolation exists
- errors are handled
- loading/empty states exist
- audit behavior is considered
- tests exist for critical behavior
- documentation is updated
- no secrets are introduced
