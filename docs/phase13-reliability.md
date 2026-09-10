# Phase 13 — Reliability & Scale

## Reliability objectives

The production service should preserve tenant authorization and core school workflows while making failures detectable, diagnosable and recoverable.

### Initial SLO targets

| Area | Target | Measurement |
| --- | --- | --- |
| API availability | >= 99.0% monthly | successful HTTP requests excluding intentional 4xx validation/auth responses |
| Readiness | >= 99.5% while expected to serve traffic | `/ready` returns HTTP 200 |
| Critical workflow errors | < 1% | login, student reads, attendance, fee/report reads |
| Request correlation | 100% | every HTTP response has `x-request-id` |
| Notification processing | no unbounded retry loop | max 5 attempts, exponential backoff, dead-letter state |

These are engineering targets, not historical guarantees. Render Free services can spin down after inactivity, so latency/availability observations must account for cold starts. Render provides service logs and metrics for runtime verification. 

## Critical workflows and failure modes

| Workflow | Failure mode | Detection | Recovery |
| --- | --- | --- | --- |
| Authentication | dependency/rate-limit failure | request logs, 401/429 rates | retry after limiter window; inspect correlated request ID |
| Student/attendance/fees reads | API or MongoDB unavailable | `/ready`, 5xx logs, request metrics | restore service/dependency; verify tenant-scoped reads |
| Notification enqueue/process | worker exception or stale lock | structured worker events, event state | automatic retry; stale lock reclaim; dead-letter after max attempts |
| Billing webhook | duplicate/replay/provider outage | webhook event state + audit trail | replay-safe retry and reconciliation |
| Deployment | bad release | readiness/5xx spike | Render rollback to recent known-good deploy |

## Operational controls

### Health

* `/health` is a liveness endpoint.
* `/ready` is the application readiness endpoint and checks MongoDB connectivity state.
* Render is configured to use `/ready` for web-service health checks.

### Diagnostics

HTTP completion events contain method, route path, status code, duration and request ID. Query strings are intentionally excluded. Unhandled errors include the same request ID plus error metadata.

### Notifications

The existing notification worker already uses bounded retries, exponential backoff, stale-lock reclamation and recipient-level idempotency. No additional queue infrastructure is introduced until production measurements demonstrate a need.

## Backup and restore disposition

The connected production Atlas cluster is a Free cluster. Atlas Cloud Backup is unavailable for Free clusters, so a production snapshot/point-in-time restore drill cannot be truthfully claimed on the current tier. A backup-capable Atlas tier is required for the full automated backup/restore portion of Phase 13.

Until that upgrade exists:

1. Do not represent the Free cluster as having Atlas Cloud Backup.
2. Keep application data in Atlas rather than Render's ephemeral filesystem.
3. Use the documented rollback path for application releases.
4. Before enabling paid backup capability, perform a non-production restore drill against a disposable target and record RPO/RTO.

## Load testing

`server/scripts/reliability-load.mjs` provides a bounded health/readiness load harness. Defaults are intentionally conservative (100 requests, concurrency 10, maximum 1000 requests / 25 concurrency). It reports p50/p95/p99 latency and HTTP status counts and fails on transport errors or 5xx responses.

`server/scripts/reliability-smoke.mjs` verifies liveness, readiness and request-ID propagation against a configured base URL.

Examples:

```text
RELIABILITY_BASE_URL=https://school-erp-api-6gm7.onrender.com node server/scripts/reliability-smoke.mjs
RELIABILITY_BASE_URL=http://localhost:4000 node server/scripts/reliability-load.mjs
```

Do not point the load harness at authenticated business endpoints or use it as a stress test against production without an explicit maintenance window and measured limits.

## Incident response

1. Capture the failing URL and `x-request-id`.
2. Check `/ready` and Render deploy status.
3. Filter Render logs by request ID and route.
4. Check MongoDB Atlas health/alerts and Performance Advisor where available.
5. Verify whether the latest deployment introduced the failure.
6. Roll back the latest application deploy when impact is ongoing and rollback is safer than live diagnosis.
7. Re-run the smoke check and one targeted authenticated workflow after recovery.
8. Record the incident, root cause, mitigation and follow-up in Linear.

## Current measured baseline — 2026-09-11

* Render service `school-erp-api` is on the Free plan and currently live.
* Atlas `Cluster0` is a Free cluster on AWS `AP_SOUTH_1`, MongoDB 8.0.32, state `IDLE`.
* Atlas Performance Advisor returned no suggested indexes, redundant/unused index suggestions, slow-query samples, or schema suggestions for the checked period.
* Existing hot-path indexes were inspected on `students`, `attendances`, `fees` and `users`; no speculative index was added.
* Render metrics showed low CPU and sub-200 MB memory usage during the observed window; HTTP metric series were empty for that window, so request latency SLO compliance is not inferred from it.

## Phase completion disposition

* Implemented: request IDs, structured request/error logging, dependency readiness, Render readiness integration, graceful shutdown, bounded smoke/load harnesses, failure-mode/SLO/incident documentation.
* Existing and verified: notification retries, stale-lock recovery, dead-letter state and idempotency.
* Provider-gated: Atlas automated snapshot/PITR backup and restore drill on the current Free cluster.
* Measurement-gated: further indexes, N+1 rewrites, new queue infrastructure and horizontal scaling. No evidence currently justifies speculative changes.
