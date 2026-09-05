# ChatGPT Engineering Workflow Protocol

> Working/development protocol only. This is **not** a product roadmap, phase plan, backlog, or project status document.
>
> **Source of truth:** GitHub for code; Linear for work/status; RDC for local execution.

## 0. Mandatory operating prompt

Use this at the start of repository engineering work:

```text
Read and follow `chatgpt-development-workflow.md` before engineering work. If it is not attached or already in context, retrieve the current version from GitHub. Treat it as the durable operating protocol, not project planning.

Use current tool evidence over memory. Inspect before editing. Make canonical source-code edits directly on GitHub. Use Remote Desktop Commander for local sync, ignored/local files, dependency installation, builds, tests, lint/typecheck, Playwright/browser/device verification, and local diagnostics. Keep GitHub and the local clone synchronized. Use Linear as work/status truth. Use Context7 before library/API decisions. Use Graphify and Semgrep through their GitHub integrations. Use MongoDB Atlas for real data/schema checks when relevant. Use Impeccable for UI work. Use Render/Vercel for deployment reality checks, not routine compilation. Never claim a check passed unless it actually ran.

Do not invent requirements, test results, database records, scan results, deployment results, commits, or tool capabilities. Distinguish VERIFIED, INFERRED, SKIPPED, BLOCKED, and FAILED. Preserve rollback safety. Never expose secrets. Avoid unnecessary Vercel previews. Prefer one coherent implementation pipeline over repeated tool hopping.
```

Repository retrieval is preferred over model memory. A useful explicit user instruction is: `Use chatgpt-development-workflow.md for this entire conversation and re-check it whenever workflow or tool choice is ambiguous.`

## 1. Core doctrine

1. **Ground truth over recall:** if a tool can verify it, verify it.
2. **Inspect before modify:** understand the actual file, callers, tests, and surrounding architecture.
3. **One authority per concern:** GitHub=code; Linear=work; Atlas=data; Context7=docs; RDC=machine; Graphify=structure; Semgrep=security; Impeccable=UI quality; Render/Vercel=deployment reality.
4. **Never fabricate:** an unrun check is not a pass.
5. **Chain tools intelligently:** do the full relevant pipeline rather than asking the user to perform routine checks.
6. **Full authority still means rollback safety:** do not force-push, destroy production data, expose secrets, or make irreversible external changes merely for convenience.

Evidence labels:
- **VERIFIED:** directly observed.
- **INFERRED:** reasoned from verified evidence.
- **SKIPPED:** intentionally not applicable/worthwhile.
- **BLOCKED:** required evidence unavailable.
- **FAILED:** check actually ran and failed.

## 2. Toolkit roles

| Tool | Doctrine |
|---|---|
| **GitHub** | Canonical code editor/source of record; inspect files/history, search, branches, commits, PRs and checks. |
| **Linear** | Source of work; read issue criteria/relations/comments before execution and record concise evidence afterward. |
| **Context7** | Current documentation authority; resolve library first, then query the exact API/version before implementation. |
| **Graphify** | GitHub-integrated code-structure/blast-radius review. Treat findings as evidence to investigate, not automatic truth. |
| **Semgrep** | GitHub-integrated security/static-analysis gate. Unresolved high-severity findings block completion. |
| **RDC** | Local execution only: sync, ignored files, dependencies, tests, builds, browser/device checks and diagnostics. |
| **MongoDB Atlas** | Real schema/index/document/query truth. Never guess production shape. Destructive writes require explicit safety discipline. |
| **Impeccable** | Existing design-system-aware UI audit/polish and slop detection. Never impose a new design system uninvited. |
| **Render** | Backend deployment/service/log/health reality. |
| **Vercel** | Frontend deployment/preview/production reality. Use sparingly because preview deployments consume quota. |
| **Plugin Management** | Discover missing external capabilities before claiming a needed service/tool is unavailable. |

Do not use a connected tool simply because it exists; use the tool that gives the strongest evidence or unique capability.

## 3. Linear workflow

Preferred execution states:

```text
Backlog → In Progress → In Review → Done
                 ↘ Canceled / Duplicate
```

Use the existing team states consistently:
- **Backlog:** queued/not being executed.
- **In Progress:** actively implementing or verifying.
- **In Review:** implementation ready for formal review, scans, acceptance and release evidence.
- **Done:** acceptance and required evidence complete.
- **Canceled/Duplicate:** terminal states.

Do not use the existing **Todo** state for normal execution when Backlog already serves that purpose. Do not create duplicate workflow systems.

Before work: fetch the ticket, acceptance criteria, relations, comments and branch. Check open/conflicting PRs. After work: record branch/PR/commit, real checks, security/deployment evidence and blockers without creating noisy progress comments for every command.

## 4. GitHub workflow

Canonical source edits happen **directly on GitHub**. RDC does not become a second source of truth.

Default branch pattern:

```text
main → araj870988/<ticket-slug>
```

Before branching, verify current `main`, existing work and the Linear branch. Keep one coherent PR per ticket unless parallel work is genuinely necessary.

A non-trivial PR should explain why, what changed, security impact, verification, and known blockers. Before merge, inspect the final diff, CI, Graphify, Semgrep, and deployment evidence required by risk. Never force-push to solve ordinary synchronization problems.

## 5. RDC workflow and synchronization

RDC is the machine execution layer. Use it for:
- `git fetch/status/switch/pull --ff-only`
- dependency installation
- ignored/local files and sanitized environment checks
- build/test/lint/typecheck
- Playwright, Expo and device/emulator checks
- local services and logs

After GitHub changes:

```text
git fetch origin
git status
git switch <working-branch>
git pull --ff-only origin <working-branch>
```

After merge:

```text
git fetch origin
git switch main
git pull --ff-only origin main
git status
```

Finish clean unless an intentional local-only investigation is active. Before `reset`, `restore`, `clean`, deletion or similar destructive commands, inspect and preserve valuable local work first.

## 6. Context7 and dependency workflow

For any library/framework/API change:

1. Resolve the library in Context7.
2. Read current documentation for the exact version/concept.
3. Compare with the repository's installed dependency.
4. Implement only after compatibility is understood.

For `npm audit`, determine the vulnerable dependency path, reachability, safe patched version and migration impact. Never blindly run `npm audit fix --force`.

## 7. Graphify and Semgrep gates

For non-trivial changes, inspect Graphify's GitHub review/check before merge. Investigate advisory findings against source and reproduce uncertain claims.

Before merge, verify Semgrep actually ran and inspect annotations. Fix legitimate findings and obtain updated evidence. Never say "Semgrep clean" when it did not run.

## 8. MongoDB Atlas and security

When database behavior matters, inspect real documents, indexes and query patterns. Tenant ownership must be enforced server-side.

Never use production data as an E2E fixture. Never expose credentials. Production deletes/updates/index/config changes must be treated as consequential even when the user has granted general development authority.

## 9. UI workflow

For UI work:

```text
existing design/tokens → implementation → Impeccable audit/polish → detector → browser/device verification
```

Preserve existing design language. For mobile, verify accessibility, touch targets, keyboard/input, loading/error/empty states and network recovery rather than copying desktop interaction literally.

## 10. Testing workflow

Use the smallest proving set first, then expand by risk.

Baseline: changed-package typecheck/build + relevant tests.

Security/ownership changes: add authorization and tenant-isolation regression coverage.

Critical journeys: E2E.

Release gate: builds + relevant regression + E2E + Graphify + Semgrep + device/browser acceptance + deployment smoke evidence when actually deployed.

A dedicated E2E environment should be isolated, deterministic, explicitly enabled, protected by strong credentials, and incapable of accidentally targeting production. Missing E2E infrastructure is **BLOCKED**, never PASS.

## 11. Vercel quota-efficient workflow

Frequent previews are wasteful on free-tier quotas. Use:

```text
local production build/test
        ↓
GitHub CI/checks
        ↓
one meaningful Vercel preview when visual/deployment evidence is needed
        ↓
production only after merge/release decision
```

Rules:
1. Do not deploy a preview after every small commit.
2. Batch related fixes before requesting a meaningful preview.
3. Prefer local/CI builds for routine compilation checks.
4. Check the existing deployment before triggering another one.
5. Diagnose logs/config instead of repeatedly redeploying.
6. If quota/build-rate-limit is reached, stop generating previews and use local/CI evidence until recovery.
7. After merge, verify the real production deployment independently.

Render follows the same principle: inspect health/logs directly when needed, but do not redeploy merely to obtain a build signal.

## 12. Documentation discipline

This file contains **working/development flow only**. Do not put phase plans, feature roadmaps, daily progress, project status, historical audits, or Linear backlog copies here.

Use:
- Linear for execution/status/acceptance evidence.
- GitHub PRs for implementation/review discussion.
- Durable project docs for architecture/product rules.
- This file for the engineering operating system itself.

## 13. Canonical pipeline

```text
Linear ticket/criteria
        ↓
open/conflicting work check
        ↓
Graphify orientation (GitHub)
        ↓
GitHub source inspection
        ↓
Atlas inspection if data-dependent
        ↓
Context7 if library/API-dependent
        ↓
GitHub branch + source edit
        ↓
RDC sync
        ↓
focused tests/build/lint
        ↓
broader regression by risk
        ↓
Impeccable if UI
        ↓
GitHub PR
        ↓
Graphify review
        ↓
Semgrep review
        ↓
fix + re-verify
        ↓
Vercel/Render only when useful
        ↓
merge
        ↓
RDC sync main
        ↓
production smoke verification when applicable
        ↓
concise Linear evidence/status
```

A trivial documentation-only or isolated change may shortcut irrelevant gates. Never shortcut a gate merely to make the workflow faster.

## 14. Anti-patterns

Never:
- edit canonical source locally instead of GitHub
- work from stale source
- branch from an unverified base
- force-push for routine sync
- claim unrun checks passed
- use production credentials/data for E2E
- trust client authorization as the security boundary
- run destructive DB operations for test convenience
- blindly force dependency upgrades
- generate unnecessary Vercel previews
- treat preview health as production health
- create duplicate progress/status Markdown files
- expose secrets

## 15. Final response contract

After engineering work, report only:

1. **Changed** — implementation summary.
2. **Verified** — exact checks that actually passed.
3. **Blocked/skipped** — required evidence not proven.
4. **Review** — PR, Graphify, Semgrep and deployment state actually observed.
5. **Next action** — only when a real dependency remains.

The goal is not the longest workflow. The goal is the safest, fastest, most reproducible engineering loop with the fewest unnecessary tool calls and deployments.
