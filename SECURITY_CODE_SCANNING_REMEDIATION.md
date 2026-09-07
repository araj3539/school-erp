# Code Scanning Remediation Workflow

## Purpose

This document is the persistent, provider-independent playbook for remediating GitHub Code Scanning findings in `araj3539/school-erp`.

Any AI coding agent working on security findings must follow this workflow unless the repository owner explicitly changes it.

## Source of truth

- **GitHub Code Scanning API:** authoritative source for the current finding inventory.
- **GitHub repository:** authoritative source for source code and code changes.
- **Linear:** progress tracker and human-readable audit trail; it must not replace the GitHub alert inventory.
- **Remote Desktop Commander:** only for local commands, tests, ignored/unpushed files, or environment inspection when needed. Do not use it as the primary mechanism for editing tracked source code.

## Required workflow — one finding at a time

### 1. Retrieve the current findings

Query GitHub Code Scanning alerts through the API. Record the current open-alert count and do not rely on an old list after merges because new scans can change the inventory.

For every finding capture:

- GitHub alert number / stable identifier
- rule / check name
- tool and analysis category
- severity / security severity
- alert state
- affected file path
- start line and end line / column when available
- message / description
- commit SHA and ref/branch when available
- pull request information when available
- rule documentation or other useful metadata

### 2. Prioritize and classify

Process findings individually. Before changing code, determine whether the finding is:

1. **Real vulnerability** — fix the root cause.
2. **Unsafe pattern with insufficient validation** — add the narrowest correct validation/sanitization.
3. **Configuration/dependency issue** — update/remove/harden the affected configuration or dependency.
4. **False positive / not applicable** — prove why the finding is safe or irrelevant before considering dismissal.
5. **Duplicate/stale finding** — verify against the current dependency graph/source and clean up the underlying stale artifact where appropriate.

Never suppress, disable, or weaken a scanner rule merely to make the alert disappear.

### 3. Retrieve exact source

Use the GitHub integration to fetch the exact affected file from the relevant commit/ref. Inspect sufficient surrounding context to understand data flow, callers, validation, authorization, tenant boundaries, and error handling.

Do not guess the source code from the alert message.

### 4. Design the smallest safe fix

Prefer a minimal, idiomatic fix that addresses the actual security property. Preserve existing behavior where safe. Avoid broad refactors unless required for the security fix.

Examples of appropriate remediation include:

- strict schema/input validation
- allowlists or canonicalization for paths/URLs
- parameterized database operations
- removing command execution interpolation
- secure dependency/configuration changes
- correct authorization/tenant-boundary checks
- safe file handling
- removal of secrets or insecure fixtures

### 5. Edit directly on GitHub

Tracked code must be changed through GitHub. Create a focused branch when appropriate, retrieve the current file, and commit the complete corrected file through GitHub's contents API. Never overwrite a file from stale content: use the current file/blob SHA.

Group multiple findings into one focused PR only when the fixes are tightly related and can be reviewed/tested together. Otherwise use separate PRs.

### 6. Validate

After each remediation batch:

- inspect the resulting diff
- run the relevant tests/lint/type checks using Remote Desktop Commander when local execution is needed
- check GitHub Actions/security checks
- verify the scanner no longer reports the remediated finding after the scan completes

A passing test suite alone does **not** prove a security finding is fixed.

### 7. Update Linear

Use the central Linear security-remediation issue/project tracker rather than creating unnecessary issues for every alert.

For each finding/batch record:

- alert ID/rule
- file and line
- classification
- root cause
- remediation performed
- PR/commit
- validation result
- final status

Keep the tracker synchronized as findings are fixed. Do not mark the overall remediation complete until a fresh GitHub Code Scanning inventory confirms the remaining findings have been individually reconciled.

### 8. Re-scan after merges

After a remediation PR is merged, obtain a fresh Code Scanning inventory. Re-check alert counts and identities because alerts can disappear, persist, or be replaced by newly exposed findings.

Continue with the next unresolved finding until the current inventory is exhausted or every remaining alert has a documented, evidence-based disposition.

## Rules for future AI agents

1. Do not assume a finding is fixed because code was changed; verify with a fresh scan.
2. Do not work from an old alert list after a merge.
3. Do not blindly dismiss findings.
4. Do not disable Semgrep/Code Scanning to reduce the count.
5. Do not edit tracked code through the local checkout when GitHub editing is available; GitHub is the code source of truth.
6. Use Remote Desktop Commander for commands/tests/local-only inspection, not as the source of truth for tracked code.
7. Preserve security behavior and existing tests.
8. For ambiguous findings, inspect the complete data flow before deciding.
9. Keep Linear as the progress/audit layer, while GitHub remains authoritative for code and alerts.
10. At the end, report: initial count, findings fixed, findings dismissed with evidence, remaining findings, PRs/commits, and validation status.

## Current remediation session

As of 2026-09-07, the repository has a known remaining Code Scanning inventory that must be re-read from GitHub before continuing. The previous remediation work reduced the inventory, but this document deliberately does not hard-code a finding count because the GitHub scan is dynamic.
