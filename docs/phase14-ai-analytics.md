# Phase 14 — AI & Advanced Analytics

## Implemented slice

This phase introduces a tenant-scoped analytics dataset and an optional AI-assisted review workflow without changing authoritative academic or financial state.

### Analytics contract

`GET /api/v1/analytics/overview?range=7|30|90`

The endpoint requires authentication and `reports:read`. Every query derives `schoolId` from the authenticated tenant context. The response contains:

- current academic year identity;
- active students, active teachers and classes;
- aggregate attendance rate;
- aggregate collections and current-year fee exposure;
- daily attendance/collection trends for the selected window;
- fee status aggregates;
- data-quality checks for missing class/section assignments and duplicate attendance entries.

The dataset intentionally excludes student names, phone numbers, admission numbers, addresses, and row-level financial information.

### AI assistance

`GET /api/v1/analytics/ai/status`

`GET /api/v1/analytics/ai/insights?range=7|30|90`

AI assistance is disabled by default. When enabled and configured, the server sends only the aggregate analytics dataset to an OpenAI-compatible `/chat/completions` endpoint. The provider is instructed to return non-authoritative suggestions only.

Provider settings are:

```text
AI_ASSISTANCE_ENABLED=false
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=
AI_TIMEOUT_MS=7000
```

The workflow has a controlled fallback: if the provider is disabled, unavailable, times out, returns an invalid response, or is unconfigured, deterministic rule-based insights are returned instead. Provider output is parsed and sanitized before it reaches the client.

### Safety and ownership

- Backend authorization is mandatory; the frontend is not a security boundary.
- Analytics queries are tenant-scoped by authenticated `schoolId`.
- AI input contains aggregate operational signals only.
- AI suggestions cannot write students, attendance, marks, fees, payments, or other records.
- Human staff remain authoritative for academic and financial decisions.
- The environment flag `AI_ASSISTANCE_ENABLED=false` is the immediate kill switch.
- AI request mode and latency are logged without prompts, API keys, student identifiers, or financial row data.

### Evaluation

Focused tests cover:

- supported analytics windows and rejection of unsupported ranges;
- tenant scoping on analytics queries;
- AI-disabled behavior;
- deterministic fallback generation;
- bounded/sanitized insight output.

### Operational disposition

No new queue, worker, cache, or database collection was introduced. The workload is read-only and aggregation-based and should remain within the existing modular-monolith architecture until measured usage justifies another execution model.
