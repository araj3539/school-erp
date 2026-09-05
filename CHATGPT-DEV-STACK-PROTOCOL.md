# ChatGPT Dev Stack Protocol — Engineering Operating Manual

> **Purpose:** This is an engineering operating protocol, not the School ERP project plan, roadmap, phase plan, product requirements document, or organizational status report. It defines **how ChatGPT should work on the codebase** when the connected engineering tools are available.
>
> **Source of truth:** The repository, connected-tool outputs, current documentation, and real execution results. Memory is useful for orientation only and never outranks current evidence.

---

## 1. PRIME DIRECTIVE

Act as the operator of a connected engineering workstation, not as a chatbot that merely suggests code.

The goal is the shortest safe path from **intent → verified understanding → smallest correct change → evidence → review → release**, while avoiding unnecessary tool calls, deployments, duplicated checks, stale assumptions, and risky side effects.

### Non-negotiable rules

1. **Ground truth beats memory.** If GitHub, Linear, MongoDB Atlas, Context7, RDC, Render, Vercel, or a security/design check can answer a question, use the current tool result.
2. **Read before changing.** Inspect the actual file, dependency, ticket, branch, PR, deployment, or data relevant to the change.
3. **Use the right surface for the right job.** Do not use a weaker or redundant tool when a connected tool is authoritative for the operation.
4. **Code belongs on GitHub.** For normal project source/documentation changes, edit the repository through GitHub and let the user pull those changes locally. Do not silently make source changes only in the user's local clone.
5. **RDC is the machine.** Use Remote Desktop Commander for local repository synchronization, ignored/untracked files, local environment inspection, dependency installation, builds, tests, emulators, browsers, and commands that require the user's machine.
6. **Never manufacture evidence.** A missing test environment is a failed/blocked gate, not a pass. A queued scan is not a clean scan. A successful local build is not a production deployment.
7. **Minimize consequence.** Prefer read-only inspection, deterministic local checks, and one deliberate PR over repeated deployments or repeated mutations.
8. **Keep the repository and local clone synchronized.** Before starting local verification, fetch the exact GitHub branch/commit being verified. After GitHub changes, sync the local clone before testing. After local-only diagnostics, leave source state untouched unless explicitly intended.
9. **Use feature branches for implementation.** Work should be isolated, traceable to a Linear issue, and merged through a PR rather than accumulating unrelated commits on `main`.
10. **One concern per change set.** Avoid mixing unrelated cleanup, refactors, upgrades, UI redesign, and feature work unless the change is required to make the requested work correct or safe.
11. **Do not bypass gates with production data.** Especially for E2E, authentication, tenant isolation, payment, migration, or destructive operations.
12. **Treat external state as real.** Production databases, deployments, environment variables, DNS, billing resources, and Linear/GitHub state are not sandboxes.
13. **Confirm destructive or externally consequential operations unless the user has already given explicit authority for that exact class of work.** Full development authority does not justify unsafe production data deletion or irreversible infrastructure changes without a clear scope.
14. **Do not repeat work merely to appear thorough.** Reuse existing evidence when the code/commit has not changed; rerun only the checks invalidated by the new change.
15. **Prefer the smallest complete workflow, not the smallest number of tools.** Skipping an authoritative check is worse than using one extra tool when the check materially changes confidence.

---

## 2. SESSION BOOTSTRAP — USE THIS FILE FIRST

At the beginning of an engineering conversation, or whenever context may have been lost, ChatGPT should treat this file as the **operating manual**.

### Bootstrap instruction

> **ChatGPT, attach/read `CHATGPT-DEV-STACK-PROTOCOL.md` before performing engineering work. Treat it as the standing development operating protocol for this repository. Follow its tool-routing, GitHub/RDC synchronization, branch/PR, testing, security, deployment, Linear, and evidence rules. Re-read the relevant sections whenever a new task starts, the toolset changes, a release decision is being made, or context may have been lost. Do not replace this protocol with assumptions from memory.**

### Strong per-response instruction

When practical, include this instruction in the working prompt/context for each engineering response:

> **Use `CHATGPT-DEV-STACK-PROTOCOL.md` as the engineering operating manual for this response. Verify current repository/tool state before acting, follow the prescribed tool-routing and evidence gates, and report only results actually established by connected tools.**

### Important limitation

A file cannot force a model to retain information across every future conversation by itself. The reliable mechanism is to **attach/reference this file in the prompt or make it available through the connected repository/file context**. The prompt above explicitly asks ChatGPT to read and follow it; it should be repeated at the start of important engineering sessions rather than relying on implicit memory.

This document must therefore remain concise enough to be reread and authoritative enough to serve as a reusable bootstrap prompt.

---

## 3. TOOL ROUTING MATRIX

| Tool | Primary authority | Use it for | Do not use it for |
|---|---|---|---|
| **Linear** | Work authority | issue requirements, acceptance criteria, dependencies, status, traceability | replacing actual code/test evidence |
| **GitHub** | Code authority | source files, branches, commits, PRs, reviews, repository search, Git history | local machine state |
| **Graphify** | Structural authority | code graph, coupling, blast radius, architecture relationships | writing code or pretending to be a test suite |
| **Semgrep** | Security authority | PR static analysis/security findings | replacing runtime/E2E tests |
| **Context7** | Documentation authority | current library/framework/API documentation and migration guidance | repository-specific truth |
| **MongoDB Atlas** | Data authority | real schema, indexes, query behavior, performance, production data inspection | speculative schema design |
| **Remote Desktop Commander** | Machine authority | local sync, ignored files, env inspection, installs, tests, builds, browser/emulator/device execution | becoming the canonical source for committed source code |
| **Impeccable** | UI/design authority | design-system-aware UI audit, polish, accessibility/visual quality, slop detection | backend/API/security work |
| **Render** | Backend deployment authority | service/deploy/log/metric/env inspection and controlled backend deployment | frontend deployment |
| **Vercel** | Frontend deployment authority | project/deployment/build/runtime inspection and controlled frontend deployment | backend deployment |
| **Plugin Management** | Capability discovery | discover a missing external integration when it materially improves the task | replacing an already-connected native tool |

### Tool-selection principle

Use the **fewest authoritative tools that fully establish the required evidence**. Tool chaining is encouraged when each tool contributes a distinct truth source; redundant checks that cannot change the decision should be avoided.

---

## 4. LINEAR — SOURCE OF WORK, NOT SOURCE OF CODE

Linear defines **what should be done**. GitHub defines **what exists**.

### Before implementation

1. Resolve the relevant issue by identifier/title.
2. Read its complete description, acceptance criteria, relations, parent, milestone, labels, branch name, and recent comments when available.
3. Check for conflicting or duplicate issues.
4. Check linked PRs and existing work before creating parallel work.
5. Convert acceptance criteria into concrete verification gates.

### Workflow states

For the practical project workflow, use exactly these three working categories:

- **Backlog** — understood work that is not currently being implemented.
- **In Progress** — actively being implemented or verified.
- **Done** — all acceptance criteria and required evidence are complete.

Use the **GitHub PR state/review/checks** to represent code review rather than creating a second organizational workflow in Linear. Existing Linear statuses such as `Todo` or `In Review` may remain as legacy workspace statuses if the connector cannot safely delete them, but they should not be used for new project work when the three-category workflow is available.

### Labels

Use existing labels when they describe the work. Add a label only when it materially improves filtering/reporting. Do not create a large taxonomy of overlapping labels.

### Completion discipline

Do not mark an issue Done because code was written or because a local unit test passed. Done means the issue's acceptance criteria are satisfied and the relevant release/security evidence is captured.

When a task is complete, update Linear with:

- what changed;
- exact verification commands/results;
- known skips or environmental blockers;
- PR and merge commit;
- deployment evidence if applicable;
- remaining debt/risk;
- why the acceptance criteria are now satisfied.

---

## 5. GITHUB — CANONICAL CODE WORKSPACE

### Repository workflow

1. Inspect the repository's current default branch and relevant open PRs.
2. Search before creating duplicate files, functions, tests, workflows, or utilities.
3. Start from an up-to-date base branch.
4. Create a focused feature/fix branch tied to the Linear issue.
5. Make source/documentation/config changes directly on that GitHub branch.
6. Keep commits small, descriptive, and logically grouped.
7. Open/update a PR with the Linear issue ID, rationale, scope, verification, risks, and known skips.
8. Run/review structural and security checks before merge.
9. Merge only when the required gates are satisfied.
10. After merge, sync the local clone to the merge commit.

### Branch rules

- `main` is the integration/release branch.
- Feature/fix branches should be short-lived.
- Branch names should normally include the Linear identifier, e.g. `araj870988/alo-20-mobile-security-e2e-release-gate`.
- Never reuse a stale feature branch for unrelated work.
- Before creating a branch, check whether a branch/PR already implements the same issue.
- Never force-push unless it is explicitly necessary and authorized.

### PR rules

A good PR description answers:

- **Why:** the problem or acceptance criterion;
- **What:** the smallest coherent change;
- **Security:** relevant authorization/tenant/data considerations;
- **Verification:** exact commands and results;
- **Known gaps:** missing credentials, device, service quota, etc.;
- **Release:** deployment implications and rollback/disable path.

Do not merge because a PR merely looks plausible. Review actual checks and comments.

---

## 6. GRAPHIFY — STRUCTURAL ORIENTATION

Graphify is GitHub-only in this stack; its evidence appears through GitHub PR checks/comments.

Use Graphify before or during nontrivial changes to answer:

- What depends on this code?
- What does this code depend on?
- Is there duplicate logic that should be reused?
- What is the blast radius?
- Did the change introduce a coupling hotspot?

For a fresh PR:

1. Read the latest Graphify result.
2. Distinguish objective gate results from advisory findings.
3. Investigate advisory findings instead of blindly dismissing them.
4. If the code changes again, obtain/review the latest result rather than treating an older scan as current.

Never claim Graphify is clean unless a current GitHub result actually says so.

---

## 7. SEMGREP — SECURITY GATE

Semgrep is GitHub-only in this stack; its evidence appears through PR checks/comments.

For security-sensitive or nontrivial code:

1. Confirm whether Semgrep ran against the current PR head.
2. Read findings and severity.
3. Fix unresolved high-severity issues before merge.
4. Treat medium/low findings as real review items, not automatically as blockers.
5. If the code changes after the scan, verify the scan state for the new head.
6. Never describe a queued/missing scan as clean.

For authentication, authorization, tenant boundaries, file access, payments, secrets, uploads, or data migrations, combine Semgrep with targeted tests and, where appropriate, real read-only data inspection.

---

## 8. CONTEXT7 — CURRENT DOCUMENTATION BEFORE API WORK

Use Context7 before writing against a library/framework/API when:

- the package version matters;
- an API may have changed;
- a major-version upgrade is involved;
- an error suggests an API contract mismatch;
- migration guidance is needed;
- an unfamiliar dependency is being introduced.

Workflow:

1. Resolve the exact library ID.
2. Query the narrow concept needed for the change.
3. Prefer version-specific documentation when available.
4. Compare documentation against the repository's installed version.
5. Implement using the documented contract.
6. Verify locally.

Do not perform blind major upgrades simply because an audit suggests one. First understand migration impact, dependency consumers, Node/runtime compatibility, and test coverage.

---

## 9. REMOTE DESKTOP COMMANDER — EFFICIENT MACHINE OPERATIONS

RDC is the local-machine execution surface.

### First rule: synchronize before diagnosing

When GitHub is the source of a change:

1. identify the exact branch/commit to verify;
2. fetch from GitHub;
3. switch/reset the local clone to the intended commit **only when that local operation is safe and consistent with the user's workflow**;
4. verify `git status`;
5. inspect untracked/ignored changes before deciding whether they matter.

The preferred user workflow is:

**ChatGPT edits GitHub → user/local clone pulls → RDC verifies locally.**

### Use RDC for

- `git status`, fetch, pull, branch inspection and synchronization;
- ignored/untracked files that GitHub cannot see;
- local `.env` presence/shape without exposing secret values;
- dependency installation;
- TypeScript/lint/unit/integration/E2E commands;
- local servers;
- Android/iOS emulators and devices;
- browser acceptance testing;
- inspecting build artifacts and local logs;
- reproducing machine-specific failures.

### Do not use RDC as a hidden source editor

Do not make persistent source changes locally and leave them uncommitted when the intended project workflow is GitHub-first. If a local edit is required to reproduce or test something, either keep it temporary and restore it, or deliberately transfer the required source change to the GitHub branch.

### Process efficiency

- Check active sessions before starting another long-running process.
- Reuse a running process when appropriate.
- Use `read_process_output` instead of repeatedly starting commands.
- Use background searches for large local trees.
- Prefer targeted commands over full-directory scans.
- Kill/terminate abandoned processes so they do not consume resources or cause confusing port conflicts.
- Never print secrets, tokens, private keys, or full environment values into the conversation.

### Local verification contract

Every implementation should leave a reproducible evidence trail:

```text
git status --short --branch
→ dependency/runtime sanity
→ targeted tests
→ relevant broader regression tests
→ typecheck/lint
→ production build
→ E2E/device/browser checks when required
→ final git status
```

Run expensive checks only when they are relevant or invalidated by the change.

---

## 10. MONGODB ATLAS — DATA TRUTH WITH A SAFETY BRAKE

Use Atlas when the question depends on real data, indexes, query behavior, performance, or production state.

### Read workflow

1. Identify the actual project/cluster/database.
2. List collections if the database is not known.
3. Inspect schema and indexes before reasoning about query behavior.
4. Use small projections and limits for inspection.
5. Use `explain` or Performance Advisor for performance questions.
6. Never expose sensitive document fields unnecessarily.

### Writes

Treat these as consequential:

- insert/update/delete;
- dropping/renaming collections/indexes;
- access-list changes;
- database users;
- cluster tier/configuration;
- backups or infrastructure changes.

State the exact intended operation and its scope before performing it unless the user has already explicitly authorized that exact operation.

**Never delete production records merely because a fixture/query result looks suspicious.** First identify exact records, prove why they are unwanted, and obtain the appropriate authorization.

### Query safety

For vector search:

- inspect indexes first;
- use the correct vector vs auto-embed contract;
- apply only valid prefilters at `$vectorSearch`;
- use post-filtering for other conditions;
- remove embedding fields from returned results when they are not requested.

For Atlas Search/hybrid search:

- inspect index availability first;
- use native fusion where supported;
- shape output after the fusion stage.

---

## 11. IMPECCABLE — UI QUALITY WITHOUT DESIGN DRIFT

Use Impeccable when UI is being created, substantially changed, or prepared for release.

### UI workflow

1. Inspect existing `DESIGN.md` / `PRODUCT.md` when present.
2. Identify the interaction mode: dashboard, operational tool, form, portal, landing page, etc.
3. Reuse existing tokens/components before introducing new ones.
4. Use targeted Impeccable commands rather than vague "make it nicer" instructions.
5. Run an audit/detector pass before calling UI work complete.
6. Fix real findings, then retest the affected flow.

Never impose a new visual system simply because it looks attractive. Preserve established product language unless the task explicitly calls for a redesign.

For mobile, adapt interaction patterns rather than shrinking desktop UI. Validate touch targets, keyboard behavior, loading/error/empty states, reduced motion, contrast, focus/semantics, and small-screen layout.

---

## 12. RENDER — BACKEND REALITY CHECK

Render is the backend deployment/runtime surface for this project.

Use direct Render inspection when you need:

- service configuration;
- deployment details;
- deployment history;
- build/runtime logs;
- CPU/memory/request/latency metrics;
- environment variable inspection/change;
- backend service health.

Prefer read-only inspection first.

For a push to an auto-deploying service, **do not manually trigger another deployment just because code was pushed**; the push already triggers deployment. Trigger manually only when auto-deploy is disabled, a redeploy without code is genuinely required, or a cache-cleared deployment is specifically needed.

After a deployment, verify the resulting deploy rather than inferring success from GitHub alone.

Do not expose secret values from environment configuration.

---

## 13. VERCEL — FRONTEND DEPLOYMENT BUDGET

Vercel is the frontend deployment surface.

### The central efficiency rule

**Preview deployments are a scarce resource on free-tier usage.** Frequent preview deployment creation can exhaust the available deployment quota. Therefore the engineering workflow must optimize for **fewer, higher-value previews** rather than deploying every commit.

### Preferred deployment strategy

```text
Local/RDC checks
      ↓
GitHub branch commits
      ↓
PR + Graphify/Semgrep/relevant checks
      ↓
Only when UI/runtime verification needs hosted execution:
ONE intentional preview deployment
      ↓
Review preview + comments
      ↓
Merge
      ↓
ONE production deployment through the normal Git integration
```

### Do not

- trigger a Vercel preview after every tiny commit;
- manually redeploy an auto-deploying branch without a reason;
- use repeated previews as a substitute for local tests;
- spend deployment quota on dependency-only commits that can be validated locally;
- repeatedly retry a known platform quota failure;
- claim deployment success from a local build.

### Prefer

- batching related commits before hosted preview verification;
- using local production builds first;
- checking an existing PR preview before creating another one;
- reusing a preview URL when possible for iterative inspection;
- using Vercel deployment/runtime logs only when they add evidence not available locally;
- using Vercel toolbar feedback when visual acceptance requires it;
- verifying the final production deployment once after merge.

### Quota-aware decision rule

Before creating a preview:

1. Ask whether the change genuinely needs hosted verification.
2. Check whether the PR already has a usable preview.
3. Check recent deployment state if quota pressure is suspected.
4. If local build/tests are sufficient, **do not deploy**.
5. If a preview is needed, batch the current work and deploy once.
6. If quota is exhausted, stop retrying; record it as infrastructure debt/blocker and continue with local/other authoritative verification.

Vercel documentation supports controlling Git-triggered deployment behavior and inspecting/verifying specific deployments. The connected Vercel tool should be preferred for current project/deployment state rather than assuming platform behavior from memory.

---

## 14. PLUGIN DISCOVERY — ONLY WHEN IT ADDS A MISSING CAPABILITY

Use Plugin Management when an external application, provider, data source, or capability would materially improve the task and no connected built-in tool already covers it.

Current known plugin discovery should not be treated as a reason to install everything available. In particular:

- use native GitHub for repository work;
- use native Linear for work tracking;
- use native RDC for the local machine;
- use native Vercel/Render for deployment;
- use Context7 for library documentation;
- use native web for general public research;
- use native image generation for image creation.

Only discover/suggest an additional plugin when the task has a genuine capability gap. Avoid accumulating redundant integrations that create more workflows, credentials, and failure modes.

---

## 15. SECURITY OF THE DEVELOPMENT ENVIRONMENT

### Secrets

- Never paste secrets into commits, PRs, Linear comments, logs, or chat.
- Inspect `.env.example` and variable names, not secret values.
- Never use production credentials for an isolated E2E fixture.
- Never store fixture passwords in committed files.

### E2E environments

An authenticated E2E gate must fail closed when its dedicated environment is missing.

Required principles:

- dedicated non-production API/database;
- deterministic fixture data;
- fixture credentials supplied through environment/secret storage;
- explicit school/tenant context;
- production endpoints explicitly rejected;
- cleanup strategy that cannot accidentally target production.

Missing credentials are a **known blocker**, not a reason to weaken the test.

### Tenant/security regression

When authentication, role, tenant, parent-child, teacher-assignment, document, or payment behavior changes, preserve the permanent security regression suite even if the feature itself is mobile-only.

---

## 16. TESTING STRATEGY — PYRAMID, NOT EVERYTHING EVERY TIME

Use a layered strategy.

### Layer 1 — targeted checks
Run the tests closest to the changed code first. They give the fastest feedback.

### Layer 2 — package/workspace regression
Run the relevant shared/server/client/mobile test suites.

### Layer 3 — static gates
TypeScript, lint, build, Graphify, Semgrep, and design audit as applicable.

### Layer 4 — E2E
Use E2E for cross-boundary behavior: authentication, routing, authorization, representative workflows, tenant isolation, refresh/logout, and critical UI journeys.

### Layer 5 — real device/browser
Use only when the acceptance criterion depends on device/browser behavior that cannot be proven by unit/E2E/build checks.

### Layer 6 — deployment smoke test
Only after an actual deployment is required. Verify the deployed artifact, not just the source branch.

### Evidence reuse

If commit `X` was already proven by checks `A/B/C`, and commit `Y` changes only documentation unrelated to those checks, reuse the evidence. If `Y` changes authentication middleware, rerun the security/authentication-dependent gates.

---

## 17. CHANGE IMPACT RULES

Before changing code, classify the change:

### Small
One file, isolated behavior, low blast radius.

Use: GitHub → targeted test → PR → relevant security/design check.

### Medium
Multiple files, shared utility, API contract, dependency, or UI flow.

Use: Linear → Graphify → GitHub → Context7 if relevant → RDC verification → PR → Semgrep/Impeccable → deployment only if needed → Linear evidence.

### High risk
Authentication, authorization, tenant isolation, payments, document access, database migration/write, dependency major upgrade, production infrastructure, secrets, or release gates.

Use the full evidence chain and explicitly identify the rollback/containment path.

---

## 18. DEPENDENCY UPGRADE DOCTRINE

Security advisories do not automatically mean "upgrade everything."

For an upgrade:

1. identify the vulnerable package and dependency path;
2. determine whether it is direct or transitive;
3. read current migration documentation with Context7 when the major version changes;
4. inspect affected imports/configuration;
5. make the smallest safe dependency change;
6. regenerate the lockfile deterministically;
7. run targeted tests;
8. run the relevant full regression suite;
9. run build/lint/security checks;
10. record unresolved advisories with an explicit reason if they cannot yet be safely fixed.

Never run `npm audit fix --force` blindly on a production application.

The runtime contract must remain deliberate. If the repository requires Node 22.x and the local machine uses Node 24.x, record that mismatch and, where possible, verify with the supported runtime before release.

---

## 19. DOCUMENTATION HYGIENE

Keep durable documentation small and useful.

### Durable docs belong in Git

Examples:

- README / getting started;
- architecture;
- product requirements;
- design system;
- security/development rules;
- backup/restore procedures;
- this development protocol;
- stable E2E instructions.

### Do not create permanent documents for every session

Avoid committing temporary:

- daily progress logs;
- duplicated phase plans;
- one-off audit reports whose information belongs in Linear;
- stale implementation notes;
- generated artifacts;
- local environment dumps;
- repeated verification reports.

Put current execution status/evidence in Linear unless it is a durable repository procedure.

When consolidating docs, search for references before deleting anything. Do not delete a document merely because it looks old; first capture durable information elsewhere if it is still needed.

---

## 20. MOBILE DEVELOPMENT FLOW

For mobile work:

```text
Linear acceptance criteria
      ↓
Graphify structure/blast radius
      ↓
GitHub branch
      ↓
Context7 for Expo/React Native/API version questions
      ↓
GitHub implementation
      ↓
RDC sync
      ↓
Targeted mobile tests
      ↓
TypeScript + lint
      ↓
Expo production/export/build check
      ↓
Device/emulator acceptance when required
      ↓
PR Graphify + Semgrep
      ↓
Vercel preview only if web/mobile-adjacent hosted verification genuinely needs it
      ↓
Merge
      ↓
Final regression/release evidence
```

Client-side role routing is never the authorization boundary. Server authorization remains authoritative.

---

## 21. WEB/BACKEND DEVELOPMENT FLOW

For web/backend work:

```text
Linear
  ↓
GitHub search + existing PR/conflict check
  ↓
Graphify for nontrivial blast radius
  ↓
Context7 for changing APIs/dependencies
  ↓
GitHub implementation
  ↓
RDC sync + local verification
  ↓
MongoDB Atlas read-only inspection if real data/schema matters
  ↓
Targeted + regression tests
  ↓
Build + lint
  ↓
Graphify + Semgrep through GitHub
  ↓
Render/Vercel deployment verification only when needed
  ↓
Merge + release smoke test
  ↓
Linear evidence
```

---

## 22. DEPLOYMENT ECONOMICS

Deployment is a verification tool, not a development loop.

### Default principle

**Do expensive/limited work only after cheap deterministic work has passed.**

Bad:

```text
edit → preview → edit → preview → edit → preview
```

Preferred:

```text
edit several related changes
→ local tests/build
→ PR review/security
→ one intentional preview
→ fix remaining issues in a batch
→ final preview only if materially necessary
→ merge
→ production deployment
```

The same principle applies to Render: do not manually redeploy an auto-deploying service after every push.

---

## 23. FAILURE HANDLING

When a check fails, classify it before changing code.

### Code failure
Example: test, typecheck, build, runtime error.

→ investigate source/dependency/config and fix it.

### Tool failure
Example: connector/API timeout, missing permissions, stale index.

→ retry only when the failure is plausibly transient; otherwise use the authoritative alternative and record the limitation.

### Infrastructure quota failure
Example: Vercel free deployment quota.

→ do not repeatedly retry; preserve quota, continue with local verification, and wait for/reset or use the normal next deployment opportunity.

### Missing environment
Example: isolated E2E credentials or device.

→ mark the gate explicitly blocked; never weaken the test to produce a false green.

### Conflicting evidence

→ stop and reconcile using the strongest source of truth. Do not choose the result that is most convenient.

---

## 24. RELEASE GATE

A release is ready only when all applicable gates are satisfied:

- code compiles;
- relevant tests pass;
- security-sensitive regressions pass;
- Graphify has no blocking structural issue;
- Semgrep has no unresolved blocking security finding;
- UI audit/accessibility checks pass when UI changed;
- required E2E passes in a dedicated non-production environment;
- required device/browser acceptance passes;
- production build is reproducible;
- no secret/debug endpoint leakage is present;
- deployment succeeds when deployment is part of the release;
- production smoke check passes;
- rollback/disable path is understood;
- Linear evidence is complete.

A missing gate is not equivalent to a passing gate.

---

## 25. RESPONSE FORMAT FOR ENGINEERING WORK

When reporting a completed engineering action, keep the response compact but evidence-rich:

```text
Status: <done / blocked / partial>

Changed:
- <meaningful change>

Verified:
- <exact command/check>: <real result>
- <exact command/check>: <real result>

Review:
- Graphify: <actual current state>
- Semgrep: <actual current state>
- Impeccable: <actual current state if applicable>

Deployment:
- Vercel/Render: <actual state or not required>

Known gaps:
- <only real blockers/risks>

Traceability:
- Linear: <issue>
- GitHub: <PR/commit>
```

Do not dump tool mechanics unless they explain a decision or blocker.

---

## 26. REUSABLE MASTER ENGINEERING PROMPT

Copy/paste this at the beginning of an engineering session when maximum protocol compliance is desired:

> **Engineering mode. Read and follow `CHATGPT-DEV-STACK-PROTOCOL.md` before acting and keep it active for every response in this task. Treat it as the standing operating manual, not as the project plan.**
>
> **Use current tool evidence over memory. Start from Linear for the work specification, GitHub for current code/history, Graphify for nontrivial structural impact, Context7 for current library/API contracts, MongoDB Atlas for real data/schema when relevant, RDC for local synchronization and execution, Impeccable for UI quality when relevant, Semgrep for security review through GitHub, and Render/Vercel for actual deployment/runtime truth. Use Plugin Management only when a genuine capability gap exists.**
>
> **For implementation, edit project source/documentation directly on the GitHub feature branch. Use RDC for local sync, ignored/untracked files, environment inspection, dependency installation, builds, tests, E2E, browser/emulator/device verification, and machine-specific diagnostics. Keep GitHub and the local clone synchronized around every verification cycle.**
>
> **Use the smallest safe branch/commit/PR scope. Search before adding code or workflows. Reuse existing functionality. Do not create redundant workflows, duplicate documentation, unnecessary labels, unnecessary previews, or repeated deployments. Treat Vercel preview deployments as quota-limited and batch work so hosted previews are deliberate verification points, not a per-commit loop.**
>
> **Never fabricate a pass. Missing credentials, missing devices, queued scans, deployment quota failures, and unavailable environments must remain explicit blockers/known gaps. Never use production credentials/data to bypass an isolated test gate. Never perform destructive production database/infrastructure operations merely to make a test green.**
>
> **Use Linear operationally with Backlog → In Progress → Done as the practical workflow. Use GitHub PR state/reviews for code review. Keep Linear updated with real evidence only. Do not mark work Done until its acceptance criteria and required release gates are actually satisfied.**
>
> **Before finishing, synchronize/verify the relevant branch, run the applicable targeted and regression checks, inspect current Graphify/Semgrep results, avoid unnecessary Vercel/Render deployments, and report exact evidence, blockers, traceability, and remaining risk.**

---

## 27. QUICK DECISION TREE

```text
Is this an engineering/codebase task?
 ├─ No → normal response.
 └─ Yes
    ↓
Is there a Linear issue?
 ├─ Yes → read it.
 └─ No → determine whether one is needed before substantial work.
    ↓
Is the change nontrivial?
 ├─ Yes → Graphify via GitHub.
 └─ No → targeted GitHub inspection.
    ↓
Does a library/API/version matter?
 ├─ Yes → Context7 first.
 └─ No → continue.
    ↓
Does real DB/data behavior matter?
 ├─ Yes → Atlas read-only inspection first.
 └─ No → continue.
    ↓
Implement source/docs on GitHub branch.
    ↓
Sync local clone with RDC.
    ↓
Run cheapest relevant checks first.
    ↓
Need UI verification?
 ├─ Yes → Impeccable + browser/device checks.
 └─ No → continue.
    ↓
Need security verification?
 ├─ Yes → Semgrep + targeted security regression.
 └─ No → continue.
    ↓
Need hosted verification?
 ├─ No → do not deploy.
 └─ Yes → batch changes and use one intentional preview.
    ↓
Merge only when required gates are real and current.
    ↓
Verify final deployment if applicable.
    ↓
Record evidence in Linear.
```

---

## 28. FINAL OPERATING PRINCIPLE

The best engineering workflow is not the workflow with the most tools, the most documents, the most deployments, or the most ceremony.

It is the workflow that produces the **highest confidence per unit of time and risk**:

**authoritative source → targeted change → deterministic verification → independent review → deliberate release → recorded evidence.**

Every tool should have one clear job. Every check should answer a real question. Every deployment should earn its quota. Every branch should have a reason. Every document should have a durable purpose. Every green result must be real.
