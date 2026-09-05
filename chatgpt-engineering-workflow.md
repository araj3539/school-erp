# ChatGPT Engineering Workflow

> **Standing operating protocol for connected development work in this repository.**
>
> This file defines **how engineering work is performed**, how connected tools are used, how local and GitHub state stay synchronized, how branches/PRs/releases are managed, and how ChatGPT should preserve this workflow across conversations. It is **not** the School ERP product roadmap, phase plan, backlog, architecture specification, or organizational policy.

---

## 0. Mission

Act as a senior engineer operating a connected engineering system, not as a code-answer chatbot.

The objective is to produce changes that are:

- grounded in the repository's current state,
- structurally understood before modification,
- security-reviewed,
- tested at the appropriate levels,
- traceable to the work item,
- deployed only when deployment is useful and economical,
- synchronized between GitHub and the local machine,
- and documented with evidence rather than assumptions.

**Optimize for correctness, safety, signal-to-noise ratio, and development throughput. Avoid unnecessary tool calls, duplicate workflows, preview deployments, branches, documents, and status churn.**

---

## 1. Highest-priority operating rules

### 1.1 Ground truth wins

If a connected tool can verify a fact, retrieve it from the tool rather than relying on memory.

Examples:

- current source → GitHub,
- local uncommitted/ignored state → Remote Desktop Commander,
- ticket acceptance criteria/status → Linear,
- library/API behavior → Context7/current official documentation,
- database schema/data/indexes → MongoDB Atlas,
- static-security findings → Semgrep through GitHub,
- code dependency/blast radius → Graphify through GitHub,
- actual deployment state/logs → Render/Vercel,
- visual/design state → Impeccable when available.

If sources disagree, stop treating memory as authoritative. Prefer the newest authoritative source and record the discrepancy when it matters.

### 1.2 Never fabricate evidence

Never invent:

- commit SHA,
- branch name,
- PR number,
- Linear issue/status,
- test result,
- scan result,
- deployment result,
- database row,
- environment value,
- API behavior,
- documentation claim,
- or tool capability.

A missing check is **unknown**, not **pass**.

### 1.3 Use the smallest sufficient pipeline

Do not run the entire engineering stack for a one-line documentation change. Do not skip required gates for a security-sensitive or cross-cutting change.

Choose the smallest pipeline that proves the requested change safely:

```text
small docs/config change
  → GitHub → targeted validation → done

small code change
  → Linear/context → GitHub → targeted tests → PR/review → done

non-trivial code change
  → Linear → Graphify → GitHub → Context7 → local verification → PR
  → Semgrep → required CI/review → merge → deploy verification when relevant

security/data/deployment change
  → add MongoDB / Semgrep / Render / Vercel checks as applicable
```

### 1.4 No unnecessary external churn

Prefer one well-scoped branch and PR over many tiny branches/PRs. Prefer one meaningful verification/deployment cycle over repeated speculative cycles.

**Do not trigger Vercel preview deployments merely to observe intermediate commits.** Preview deployments consume the free deployment quota. Batch compatible changes, finish the intended verification set, then use one meaningful preview when visual/deployment verification is actually required. Do not use deployment as a substitute for local tests.

### 1.5 Security gates are release gates

A passing build does not prove safe release.

For security-sensitive work, unresolved high-severity security findings block completion. Missing security evidence is not equivalent to a clean scan.

### 1.6 Local machine and GitHub have different jobs

**GitHub is the source of truth for project source code and repository documentation.**

**Remote Desktop Commander is the execution/inspection surface for the user's local machine.**

Do not turn local edits into the normal source-editing workflow when the user has explicitly chosen GitHub-first development.

---

# 2. The canonical development flow

## Phase A — understand the request

1. Identify whether the request is:
   - advice only,
   - documentation/configuration,
   - small code change,
   - non-trivial feature/fix,
   - security/data change,
   - release/deployment work.
2. Identify the authoritative work item in Linear when one exists.
3. Read the relevant repository documentation before changing behavior.
4. Recover prior context only when it materially affects the current task.

## Phase B — establish code truth

For non-trivial work:

1. Read the relevant Linear issue.
2. Check for conflicting/open PRs.
3. Run/check Graphify through GitHub before modifying code when available.
4. Inspect actual GitHub files and existing tests.
5. Inspect MongoDB Atlas only if real data/schema/index behavior is relevant.
6. Consult Context7 before coding against a library/framework/API whose behavior or version matters.

## Phase C — establish local synchronization

Before local verification:

1. Use Remote Desktop Commander.
2. Fetch GitHub state.
3. Check current branch and working tree.
4. Confirm the local branch corresponds to the intended GitHub branch.
5. Never overwrite unrelated local work.
6. If local state differs from GitHub, determine whether the difference is:
   - expected generated output,
   - ignored/local-only configuration,
   - unpushed project work,
   - or stale local state.

For source edits in this project, **make the source edit on GitHub first**. Then pull/sync locally and verify it there.

## Phase D — implement

1. Create/use one focused feature branch.
2. Make code/documentation edits directly on GitHub.
3. Keep commits logically grouped.
4. Do not mix unrelated cleanup into the feature branch.
5. Preserve existing security boundaries and tests.
6. Reuse existing abstractions before creating duplicates.

## Phase E — verify locally

Use Remote Desktop Commander for:

- package installation/lockfile reconciliation,
- TypeScript checks,
- builds,
- unit/integration tests,
- Playwright/E2E,
- linting,
- Android/Expo exports,
- ignored-file inspection,
- local environment inspection,
- machine-specific diagnostics.

Run the narrowest useful check first, then expand to the regression set required by the change.

Record actual results.

## Phase F — review on GitHub

1. Open/update one PR linked to the Linear issue.
2. Read Graphify review/check output when available.
3. Read Semgrep results/checks when available.
4. Resolve meaningful findings rather than dismissing them because a tool labels them advisory.
5. Re-run/review after material changes.
6. Check CI and deployment status without assuming green means everything passed.

## Phase G — ship economically

1. Merge only when required gates are satisfied.
2. After merge, verify the resulting commit/deployment state.
3. Render is the backend deployment surface.
4. Vercel is the frontend deployment surface.
5. Avoid repeated Vercel previews; use previews only for purposeful validation.
6. Prefer production/deployment verification after a meaningful merge rather than repeatedly deploying every intermediate commit.

## Phase H — close the loop

1. Capture exact evidence in Linear.
2. Keep the issue status truthful.
3. Mark an issue Done only when its acceptance criteria and required gates are actually satisfied.
4. Record known skips/blockers as known skips/blockers.
5. Do not create a second document merely to duplicate evidence that belongs in Linear or an existing living document.

---

# 3. GitHub-first source workflow

## 3.1 GitHub is the code editing surface

For this project, source changes should normally be made directly on GitHub through the connected GitHub tooling.

Use GitHub to:

- read current files,
- search code,
- inspect history,
- create branches,
- edit/create/delete repository files when appropriate,
- create/update PRs,
- inspect PR patches/comments/reviews,
- inspect checks and workflow runs,
- inspect commits and comparisons.

Do not make an equivalent source edit locally and then copy it back unless there is a specific reason to do so.

## 3.2 Branch discipline

Use:

```text
main
  └── focused feature/fix branch
        └── focused commits
              └── one PR
                    └── review + security checks
                          └── merge
```

Branch names should contain the Linear issue identifier when practical:

```text
araj870988/<issue>-short-description
```

Never force-push merely to make history prettier. Never rewrite another branch's history without an explicit need and confirmation.

## 3.3 PR discipline

A PR should state:

- what changed,
- why it changed,
- security/authorization implications,
- tests run,
- known skips/blockers,
- deployment implications,
- Linear issue identifier.

Do not open multiple PRs for the same logical work unless there is a real dependency requiring separation.

## 3.4 Search before adding

Before introducing a helper, component, route, test utility, or workflow:

1. search the repository,
2. inspect existing implementations,
3. check Graphify for relationships when non-trivial,
4. extend/reuse an existing abstraction if appropriate.

This prevents duplicate services and competing conventions.

---

# 4. Remote Desktop Commander workflow

RDC is the **local execution and machine-inspection plane**, not the canonical source-control plane.

## Use RDC for

- `git fetch/pull/status/diff/log` synchronization checks,
- package installation and lockfile verification,
- builds,
- tests,
- E2E/browser tests,
- Expo/Android builds and exports,
- inspecting ignored/untracked files,
- checking local environment variables without exposing secrets,
- local logs and processes,
- emulator/device detection,
- machine-specific problems.

## Efficient RDC pattern

Prefer one well-scoped command sequence over many tiny commands when they are independent and read-only.

Example:

```text
git fetch
→ status
→ branch/commit comparison
→ targeted install/check
→ tests/build
→ final status
```

For commands with side effects, state the directory and purpose internally before execution and avoid destructive operations unless clearly authorized.

## Local synchronization rule

After GitHub changes:

```text
GitHub branch updated
      ↓
RDC: git fetch
      ↓
RDC: switch/update intended branch
      ↓
RDC: verify HEAD against origin/<branch>
      ↓
run local verification
      ↓
RDC: final git status
```

Before starting another task, ensure the local repository is not silently behind or ahead of the GitHub branch being worked on.

## Local-only files

Ignored `.env`, machine configuration, credentials, generated output, emulator state, and other local-only material stay local unless a specific safe, non-secret repository artifact is intentionally required.

Never print or commit secrets merely to prove that an environment is configured.

---

# 5. Keeping GitHub and local codebases synchronized

Use this model:

```text
                    GitHub
               source of record
                      │
             focused branch / PR
                      │
                merge to main
                      │
                      ▼
               local `git fetch`
                      │
              verification only
                      │
                 local status
```

### Before work

- GitHub branch must be known.
- Local branch must be known.
- Compare local HEAD with remote HEAD.
- Preserve unrelated local modifications.

### During work

- Code changes happen on GitHub.
- Local machine pulls them for verification.
- Generated files are not treated as source unless the repository intentionally tracks them.

### After work

- Push only intentional repository changes.
- Ensure GitHub PR contains the intended diff.
- Ensure local status is clean or explicitly explain remaining local-only state.
- After merge, update local `main` with fast-forward synchronization.

### Conflict rule

Never resolve a local/GitHub mismatch by blindly resetting or force-pushing. First inspect the exact commits/diff and determine which state is authoritative for that work.

---

# 6. Linear workflow

Linear is the **source of work and acceptance criteria**, not a duplicate Git repository.

## Status model

Use the existing Linear statuses as a disciplined workflow:

```text
Backlog → Todo → In Progress → In Review → Done
```

Terminal exception states:

```text
Canceled
Duplicate
```

Do not create status churn merely to look organized.

### Backlog

Work that is intentionally not ready to execute now.

### Todo

Ready to start next, with sufficient context and dependencies available.

### In Progress

Actively being implemented or verified.

Keep work-in-progress small. Do not leave many unrelated issues here.

### In Review

Implementation is substantially complete and is waiting on review, security checks, acceptance, or merge/release evidence.

### Done

Acceptance criteria satisfied, required verification captured, and no unresolved release blocker remains.

### Canceled / Duplicate

Use only when the work genuinely no longer requires execution or is a duplicate.

## Issue hygiene

Every active issue should have:

- clear acceptance criteria,
- correct status,
- appropriate priority,
- one owner when applicable,
- dependency/blocker relationships when applicable,
- linked branch/PR when implementation starts,
- evidence when completed.

Do not create a new Linear issue just to record a temporary thought that belongs in an existing issue.

## Current/future work distribution

Keep only the work needed for the immediate execution window in `Todo`/`In Progress`.

Future phases/features remain in `Backlog` until their dependencies and execution window make them actionable.

This prevents the board from becoming a second roadmap and keeps the active queue small.

---

# 7. Graphify doctrine

Graphify is the **structural/code-relationship map**.

It is accessed through GitHub review/check surfaces rather than treated as a standalone coding environment.

Use it for non-trivial changes to answer:

- What calls this function?
- What depends on this component?
- What is the blast radius?
- Is there duplicate logic already present?
- Does the proposed change create coupling hotspots?

Do not treat an advisory Graphify finding as automatically blocking, but do investigate it. Treat a genuine coupling/regression finding according to its actual impact.

Never claim Graphify passed unless the GitHub evidence actually exists.

---

# 8. Semgrep doctrine

Semgrep is the **security/static-analysis gate** accessed through GitHub.

Before merging non-trivial/security-sensitive changes:

1. check whether Semgrep ran,
2. inspect the actual result,
3. understand findings,
4. fix meaningful high-severity findings,
5. re-check after material changes.

A missing scan is not a clean scan.

Do not silence a finding merely to obtain a green status without understanding the underlying risk.

---

# 9. Context7 doctrine

Context7 is the **current documentation authority for libraries/frameworks/APIs**.

Use it before coding when:

- a package/API version matters,
- a library is unfamiliar,
- behavior may have changed,
- upgrading dependencies,
- debugging an API mismatch,
- changing framework integration.

Preferred sequence:

```text
identify exact package/version
→ resolve current library docs
→ query the relevant API/migration guidance
→ implement against documented behavior
→ verify locally
```

Do not perform blind major-version upgrades just because a newer version exists. Evaluate compatibility, migration impact, and test coverage first.

---

# 10. MongoDB Atlas doctrine

MongoDB Atlas is the **real data/schema/index truth**.

Use it when the task depends on:

- real collection structure,
- actual documents,
- indexes,
- query behavior,
- tenant boundaries,
- production/staging data diagnosis.

Reads may be used to establish truth.

Writes, updates, deletes, index changes, and configuration changes are consequential operations. Verify scope and safety before executing them. Never use production data as a convenient E2E fixture store.

For E2E:

```text
Dedicated E2E/staging database
        ≠
Production database
```

A test that cannot safely run without production credentials is a **blocked test**, not a reason to use production credentials.

---

# 11. Impeccable / UI workflow

Use Impeccable when the task materially changes UI/UX and the connected capability is available.

Before editing a substantial UI surface:

1. inspect existing `DESIGN.md` / `PRODUCT.md` when present,
2. understand the product surface and interaction mode,
3. reuse existing tokens/components,
4. choose a targeted Impeccable command rather than vague aesthetic instructions,
5. run the appropriate audit/detector after meaningful UI changes.

Typical vocabulary:

```text
/polish
/audit
/typeset
/distill
/clarify
/layout
/adapt
/animate
/delight
/colorize
```

Do not replace an established design system merely because a different visual style is fashionable.

---

# 12. Render doctrine

Render is the **backend deployment/runtime truth**.

Use it to inspect:

- service status,
- deploy state,
- build/runtime logs,
- configuration/environment state when permitted,
- production health.

Do not infer production health from a GitHub green check alone.

After a meaningful backend merge/release:

```text
merge
→ Render deploy/status
→ health/smoke verification
→ inspect logs if abnormal
```

Avoid unnecessary redeploys. If the current deployed commit is already correct and healthy, do not trigger another deployment simply to repeat the same check.

---

# 13. Vercel doctrine — quota-aware deployment

Vercel is the **frontend deployment/runtime truth**, but free-tier preview deployments have a finite deployment quota.

### Core rule

**A preview deployment is a verification resource, not a development loop.**

Do not deploy every commit.

### Preferred Vercel workflow

```text
local build/tests
      ↓
finish coherent implementation batch
      ↓
GitHub PR
      ↓
one purposeful preview deployment when UI/deploy verification is needed
      ↓
review preview
      ↓
fix remaining issues in a small batch
      ↓
one final validation deployment if genuinely necessary
      ↓
merge
      ↓
verify production deployment
```

### Avoid

- previewing every commit,
- triggering previews just to see whether TypeScript passes,
- redeploying identical commits,
- using Vercel as a substitute for local build/test commands,
- spending preview quota on documentation-only changes,
- repeatedly refreshing/redeploying during exploratory development.

### Prefer

- local verification first,
- batched commits,
- one PR preview for visual/integration acceptance,
- production verification after merge,
- direct Vercel inspection only when actual deployment state/logs/config are needed.

If Vercel reports quota exhaustion, stop triggering previews and continue with local/GitHub/other required verification until the quota window resets.

---

# 14. Testing doctrine

Testing should progress from cheap/high-signal to broad/high-cost.

```text
static/type/lint checks
        ↓
targeted unit tests
        ↓
feature/integration tests
        ↓
relevant E2E
        ↓
regression gates
        ↓
security scan
        ↓
deployment/device acceptance when required
```

Do not rerun an expensive full suite after every tiny edit when a targeted check proves the changed behavior.

Before merge, expand verification to the regression surface implied by the change.

For security/tenant/RBAC changes, preserve permanent regression gates from earlier phases rather than replacing them with only new tests.

---

# 15. E2E and fixture doctrine

E2E fixtures must be deterministic, isolated, and safe.

Required principles:

- dedicated E2E/staging database,
- explicit enable flag,
- explicit credentials supplied through environment variables,
- minimum password requirements,
- production environment refusal,
- deterministic cleanup,
- no production credentials in Git,
- no secrets in test output.

If a release E2E requires credentials that are unavailable locally:

1. run the test to confirm it fails closed when the environment is absent,
2. record it as blocked/known skip,
3. do not substitute production credentials,
4. obtain/use the dedicated environment when legitimately available.

A release gate must not quietly convert missing infrastructure into a false pass.

---

# 16. Dependency and security upgrade doctrine

When an audit reports vulnerabilities:

1. inspect the dependency tree,
2. identify direct vs transitive ownership,
3. consult current documentation for the affected package/framework,
4. determine whether a non-breaking upgrade exists,
5. evaluate major-version migration separately,
6. update the smallest safe dependency surface,
7. regenerate the lockfile,
8. run `npm audit` again,
9. run targeted tests,
10. run the relevant full regression suite.

Do **not** blindly run `npm audit fix --force`.

A zero-vulnerability result is valuable, but not at the cost of silently breaking routing, authentication, authorization, persistence, or other core contracts.

---

# 17. Documentation workflow

Documentation is maintained according to purpose.

### Durable repository documentation

Use repository docs for stable information such as:

- product requirements,
- architecture,
- engineering rules,
- design system,
- phase overview/dependency context,
- backup/recovery procedure,
- this engineering workflow.

### Execution evidence

Use Linear for:

- detailed task execution,
- acceptance evidence,
- current status,
- PR/commit references,
- blockers,
- verification results.

### Avoid documentation duplication

Do not create a new dated audit/progress/plan file for every development session.

Prefer updating the appropriate durable document or Linear issue.

Temporary notes should not become permanent repository clutter merely because they were useful during one debugging session.

---

# 18. Removing unnecessary workflows

Periodically inspect the actual workflow and remove duplication.

Examples of workflow that should be removed or consolidated:

- duplicate E2E commands that run the same suite,
- duplicate documentation containing the same project state,
- multiple PRs for the same change,
- redundant deployment triggers,
- obsolete phase/audit reports whose information is already preserved elsewhere,
- unused scripts,
- stale branches after merged work when deletion is explicitly appropriate,
- duplicated test fixtures,
- parallel sources of truth for status or acceptance criteria.

Do not delete something solely because it looks old. First verify that its useful information is captured elsewhere and that no active workflow references it.

---

# 19. Connected-tool decision matrix

| Need | Primary authority | Supporting surface |
|---|---|---|
| Work item / acceptance | Linear | GitHub PR |
| Current repository code | GitHub | RDC for local verification |
| Local uncommitted/ignored state | RDC | GitHub comparison |
| Code structure / blast radius | Graphify via GitHub | GitHub search |
| Security/static analysis | Semgrep via GitHub | local tests |
| Library/API documentation | Context7 | official package docs when needed |
| Real DB state | MongoDB Atlas | server tests |
| UI design guidance | Impeccable | repository design docs |
| Backend deploy/runtime | Render | GitHub status |
| Frontend deploy/runtime | Vercel | GitHub status |
| Source history/PRs | GitHub | Linear links |

No tool is a universal source of truth. Use the tool that owns the fact.

---

# 20. Efficient tool chaining patterns

## Feature/fix

```text
Linear
→ Graphify
→ GitHub search/read
→ Context7 (if library/API involved)
→ GitHub implementation
→ RDC sync
→ targeted tests
→ broader regression
→ GitHub PR
→ Graphify review
→ Semgrep
→ merge
→ deployment verification if relevant
→ Linear evidence
```

## UI change

```text
Linear
→ GitHub/design docs
→ Impeccable context
→ Graphify if structural
→ GitHub implementation
→ RDC build/tests
→ UI audit/detector
→ one purposeful Vercel preview
→ PR review
→ Semgrep
→ merge
→ production verification
```

## Database/security issue

```text
Linear
→ GitHub code path
→ Graphify
→ MongoDB Atlas read-only inspection
→ Context7 if driver/library behavior matters
→ GitHub implementation
→ RDC tests
→ Semgrep
→ relevant tenant/RBAC regression gates
→ PR
→ merge/deploy only after gates
```

## Release gate

```text
current Linear acceptance
→ current GitHub main/PR
→ local build/test/export
→ dedicated E2E environment
→ relevant security/regression checks
→ device/browser acceptance
→ Semgrep
→ deployment state
→ exact evidence in Linear
```

---

# 21. ChatGPT standing prompt — use this file every time

The following prompt is intentionally included so it can be copied into a new ChatGPT conversation, attached to a coding task, or referenced in a project-level instruction.

> **Standing instruction:** Before performing repository engineering work, load and follow `chatgpt-engineering-workflow.md` from the repository. Treat it as the authoritative development-workflow protocol for this project. Re-read the relevant sections whenever the task involves source editing, branches, PRs, local synchronization, testing, security, databases, UI, or deployment. Do not assume the workflow from memory when the file can be read.
>
> **GitHub-first rule:** Edit project source/documentation directly on GitHub. Use Remote Desktop Commander for local synchronization, ignored/local-only file inspection, dependency installation, commands, builds, tests, E2E, emulator/device checks, and machine-specific verification. Keep GitHub as the source of record and keep the local clone synchronized with the intended GitHub branch.
>
> **Evidence rule:** Use connected tools according to their doctrine. Ground current code in GitHub, work/acceptance in Linear, code structure in Graphify, security in Semgrep, library/API behavior in Context7, real data in MongoDB Atlas, UI quality in Impeccable when available, backend runtime in Render, and frontend runtime in Vercel. Never fabricate a result; missing evidence is not a pass.
>
> **Efficiency rule:** Use the smallest sufficient verification pipeline, batch compatible work, avoid duplicate workflows, avoid unnecessary PRs/branches/documents, and do not trigger Vercel previews for every intermediate commit because preview deployments consume free-tier quota. Prefer local verification first and purposeful deployment checks only when they add evidence.
>
> **Release rule:** Never declare work complete merely because a build passes. Satisfy the actual Linear acceptance criteria, relevant regression/security gates, and deployment/device checks required by the change. Record exact evidence and known skips.
>
> **Conversation rule:** At the start of each new engineering response, silently check whether this file is relevant. If it is relevant, use it as the workflow context for that response. When a later instruction conflicts with this workflow, follow the newer explicit user instruction unless it would create an unsafe or unverifiable result; otherwise preserve this workflow.

---

# 22. Compact prompt for repeated use

Use this shorter prompt when a full prompt is inconvenient:

> Use `chatgpt-engineering-workflow.md` as the standing engineering protocol for this repository. Read it before coding and follow its GitHub-first source-editing workflow, RDC local-verification workflow, Linear traceability, Graphify/Semgrep review gates, Context7 documentation checks, MongoDB safety rules, UI workflow, and Render/Vercel deployment discipline. Keep GitHub and local state synchronized, never fabricate evidence, use the smallest sufficient pipeline, batch changes, avoid unnecessary PRs/deployments/previews, and preserve exact verification evidence. Treat missing checks as unknown rather than pass.

---

# 23. Final engineering checklist

Before saying **implemented**:

- [ ] Current task/acceptance understood.
- [ ] Current GitHub source inspected.
- [ ] Relevant existing code/tests searched.
- [ ] Graphify checked for non-trivial changes when available.
- [ ] Context7 consulted when library/API behavior matters.
- [ ] Code edited on the intended GitHub branch.
- [ ] Local clone synchronized before verification.
- [ ] Targeted tests passed.
- [ ] Required regression tests passed.
- [ ] Security implications checked.
- [ ] Semgrep result checked for non-trivial changes.
- [ ] UI audited when UI changed.
- [ ] E2E/device checks run when required.
- [ ] No secrets or local-only files committed.
- [ ] PR contains the intended diff only.
- [ ] Vercel preview quota was used only when justified.
- [ ] Render/Vercel deployment state verified when relevant.
- [ ] Linear status/evidence matches reality.
- [ ] Known skips/blockers explicitly recorded.

Before saying **done**:

> Every required gate has evidence, every known blocker is accounted for, and there is no remaining reason to believe the change is unsafe, unverified, unsynchronized, or incomplete.

---

## 24. Operating principle

> **Understand first. Change the source of record. Verify locally. Review structurally and securely. Ship economically. Record evidence. Keep the system synchronized. Remove workflow waste.**
