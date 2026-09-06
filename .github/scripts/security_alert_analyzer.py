#!/usr/bin/env python3
"""Read-only GitHub Code Scanning -> OpenAI security alert analyzer.

This script deliberately has no GitHub write operations and never updates or
 dismisses a code-scanning alert. It produces JSON/Markdown artifacts only.
"""

from __future__ import annotations

import base64
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


GITHUB_API = "https://api.github.com"
OPENAI_API = "https://api.openai.com/v1/responses"
OWNER = "araj3539"
REPO = "school-erp"
API_VERSION = "2026-03-10"
OUTPUT_DIR = Path("security-alert-analysis")
SOURCE_CONTEXT_LINES = 80
MAX_SOURCE_CHARS = 24000
MAX_ALERTS = 100


class APIError(RuntimeError):
    pass


def request_json(url: str, token: str, *, method: str = "GET", body: Any | None = None) -> Any:
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": API_VERSION,
        "User-Agent": "school-erp-security-alert-analyzer",
    }
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    req = Request(url, headers=headers, method=method, data=data)
    try:
        with urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:2000]
        raise APIError(f"GitHub API {exc.code} for {url}: {detail}") from exc
    except URLError as exc:
        raise APIError(f"GitHub API connection failed for {url}: {exc}") from exc


def openai_json(instructions: str, input_payload: dict[str, Any], api_key: str, model: str) -> dict[str, Any]:
    schema = {
        "type": "object",
        "properties": {
            "verdict": {"type": "string", "enum": ["true_positive", "false_positive", "needs_investigation"]},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "severity": {"type": "string", "enum": ["critical", "high", "medium", "low", "informational", "unknown"]},
            "exploitability": {"type": "string", "enum": ["high", "moderate", "low", "none", "unknown"]},
            "tenant_boundary_risk": {"type": "string", "enum": ["high", "moderate", "low", "none", "unknown"]},
            "context_sufficient": {"type": "boolean"},
            "requires_human_review": {"type": "boolean"},
            "rationale": {"type": "string"},
            "attack_path": {"type": "string"},
            "evidence": {"type": "array", "items": {"type": "string"}},
            "recommended_fix": {"type": "array", "items": {"type": "string"}},
            "tests_required": {"type": "array", "items": {"type": "string"}},
            "missing_context": {"type": "array", "items": {"type": "string"}},
        },
        "required": [
            "verdict",
            "confidence",
            "severity",
            "exploitability",
            "tenant_boundary_risk",
            "context_sufficient",
            "requires_human_review",
            "rationale",
            "attack_path",
            "evidence",
            "recommended_fix",
            "tests_required",
            "missing_context",
        ],
        "additionalProperties": False,
    }

    payload = {
        "model": model,
        "store": False,
        "instructions": instructions,
        "input": json.dumps(input_payload, ensure_ascii=False),
        "text": {
            "format": {
                "type": "json_schema",
                "name": "security_alert_analysis",
                "strict": True,
                "schema": schema,
            }
        },
    }
    req = Request(
        OPENAI_API,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "school-erp-security-alert-analyzer",
        },
        method="POST",
        data=json.dumps(payload).encode("utf-8"),
    )
    try:
        with urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:3000]
        raise APIError(f"OpenAI API {exc.code}: {detail}") from exc
    except URLError as exc:
        raise APIError(f"OpenAI API connection failed: {exc}") from exc

    text = result.get("output_text")
    if not text:
        for item in result.get("output", []):
            if item.get("type") != "message":
                continue
            for content in item.get("content", []):
                if content.get("type") == "output_text" and content.get("text"):
                    text = content["text"]
                    break
            if text:
                break
    if not text:
        raise APIError("OpenAI response did not contain output text")
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise APIError(f"OpenAI returned non-JSON structured output: {text[:1000]}") from exc


def github_alerts(token: str, ref: str, state: str) -> list[dict[str, Any]]:
    alerts: list[dict[str, Any]] = []
    for page in range(1, 101):
        params = {"state": state, "per_page": "100", "page": str(page)}
        if ref:
            params["ref"] = ref
        url = f"{GITHUB_API}/repos/{OWNER}/{REPO}/code-scanning/alerts?{urlencode(params)}"
        page_items = request_json(url, token)
        if not isinstance(page_items, list):
            raise APIError("GitHub code-scanning alerts endpoint returned an unexpected response")
        alerts.extend(page_items)
        if len(page_items) < 100:
            break
        if len(alerts) >= MAX_ALERTS:
            break
    return alerts[:MAX_ALERTS]


def github_file(token: str, path: str, ref: str) -> str:
    url = f"{GITHUB_API}/repos/{OWNER}/{REPO}/contents/{quote(path, safe='/')}?ref={quote(ref, safe='') }"
    data = request_json(url, token)
    if not isinstance(data, dict) or data.get("encoding") != "base64":
        raise APIError(f"Could not retrieve text source file {path}")
    try:
        return base64.b64decode(data["content"]).decode("utf-8")
    except (ValueError, UnicodeDecodeError) as exc:
        raise APIError(f"Source file {path} is not UTF-8 text") from exc


def redact_obvious_secrets(text: str) -> str:
    patterns = [
        (r"(?i)(authorization\\s*[:=]\\s*bearer\\s+)[A-Za-z0-9._-]+", r"\\1[REDACTED]"),
        (r"(?i)(api[_-]?key\\s*[:=]\\s*)[A-Za-z0-9._-]{16,}", r"\\1[REDACTED]"),
        (r"(?i)(secret[_-]?key\\s*[:=]\\s*)[A-Za-z0-9._-]{16,}", r"\\1[REDACTED]"),
        (r"(?i)(password\\s*[:=]\\s*)[^\\s,;]+", r"\\1[REDACTED]"),
    ]
    for pattern, replacement in patterns:
        text = re.sub(pattern, replacement, text)
    return text


def source_context(source: str, start_line: int, end_line: int) -> str:
    lines = source.splitlines()
    start = max(1, start_line - SOURCE_CONTEXT_LINES)
    end = min(len(lines), end_line + SOURCE_CONTEXT_LINES)
    rendered = [f"{number:6d} | {lines[number - 1]}" for number in range(start, end + 1)]
    text = "\n".join(rendered)
    text = redact_obvious_secrets(text)
    if len(text) > MAX_SOURCE_CHARS:
        text = text[:MAX_SOURCE_CHARS] + "\n[context truncated]"
    return text


def build_analysis_input(alert: dict[str, Any], context: str, target_ref: str) -> dict[str, Any]:
    instance = alert.get("most_recent_instance") or {}
    rule = alert.get("rule") or {}
    tool = alert.get("tool") or {}
    location = instance.get("location") or {}
    return {
        "repository": f"{OWNER}/{REPO}",
        "target_ref": target_ref,
        "alert": {
            "number": alert.get("number"),
            "state": alert.get("state"),
            "html_url": alert.get("html_url"),
            "created_at": alert.get("created_at"),
            "updated_at": alert.get("updated_at"),
            "rule": {
                "id": rule.get("id"),
                "name": rule.get("name"),
                "description": rule.get("description"),
                "full_description": rule.get("full_description"),
                "severity": rule.get("severity"),
                "security_severity_level": rule.get("security_severity_level"),
                "tags": rule.get("tags", []),
            },
            "tool": {
                "name": tool.get("name"),
                "version": tool.get("version"),
            },
            "instance": {
                "ref": instance.get("ref"),
                "commit_sha": instance.get("commit_sha"),
                "message": instance.get("message"),
                "location": location,
                "classifications": instance.get("classifications", []),
            },
        },
        "source_context": context,
    }


def main() -> int:
    github_token = os.environ.get("GITHUB_TOKEN")
    openai_key = os.environ.get("OPENAI_API_KEY")
    target_ref = os.environ.get("TARGET_REF", "refs/heads/main")
    alert_state = os.environ.get("ALERT_STATE", "open")
    model = os.environ.get("OPENAI_MODEL", "gpt-5.6")

    if not github_token:
        raise APIError("GITHUB_TOKEN is required")
    if not openai_key:
        raise APIError("OPENAI_API_KEY GitHub Actions secret is required")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    alerts = github_alerts(github_token, target_ref, alert_state)

    instructions = """You are a senior application security reviewer analyzing a GitHub Code Scanning alert.

Use only the supplied alert metadata and source context as evidence. Do not assume code exists that was not supplied.
Trace the data flow from the alert's source/location toward the security-sensitive sink when possible.
Distinguish scanner suspicion from demonstrated exploitability.
If relevant code, validation, authorization, tenant isolation, or sanitization is missing, choose needs_investigation and set context_sufficient=false instead of guessing.
For multi-tenant ERP code, explicitly assess whether the issue could broaden access across school/tenant boundaries.
Do not recommend dismissing an alert merely because the exploit is inconvenient or because another layer might protect it unless that layer is visible in the supplied evidence.
Do not modify code, dismiss alerts, or claim that a fix exists unless the supplied code demonstrates it.
This is a read-only triage report; every conclusion must be supported by concrete evidence from the supplied material.
"""

    report: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []

    for index, alert in enumerate(alerts, start=1):
        instance = alert.get("most_recent_instance") or {}
        location = instance.get("location") or {}
        path = location.get("path")
        start_line = int(location.get("start_line") or 1)
        end_line = int(location.get("end_line") or start_line)
        commit_sha = instance.get("commit_sha") or ""
        source = ""
        context_error = None

        if path and commit_sha:
            try:
                source = github_file(github_token, path, commit_sha)
            except APIError as exc:
                context_error = str(exc)
        else:
            context_error = "Alert did not provide a source path and commit SHA"

        context = source_context(source, start_line, end_line) if source else "[source context unavailable]"
        payload = build_analysis_input(alert, context, target_ref)
        if context_error:
            payload["source_context_error"] = context_error

        try:
            analysis = openai_json(instructions, payload, openai_key, model)
            report.append({
                "alert_number": alert.get("number"),
                "rule_id": (alert.get("rule") or {}).get("id"),
                "path": path,
                "line": start_line,
                "analysis": analysis,
            })
        except APIError as exc:
            failures.append({"alert_number": alert.get("number"), "error": str(exc)})

        print(f"Analyzed {index}/{len(alerts)} alert(s)", flush=True)
        time.sleep(0.25)

    result = {
        "schema_version": 1,
        "repository": f"{OWNER}/{REPO}",
        "target_ref": target_ref,
        "alert_state": alert_state,
        "model": model,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "alerts_seen": len(alerts),
        "analyses_completed": len(report),
        "analysis_failures": failures,
        "analyses": report,
        "read_only": True,
    }
    (OUTPUT_DIR / "report.json").write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    md = [
        "# AI Security Alert Analysis",
        "",
        f"- Repository: `{OWNER}/{REPO}`",
        f"- Ref: `{target_ref}`",
        f"- Alert state: `{alert_state}`",
        f"- Model: `{model}`",
        f"- Alerts seen: **{len(alerts)}**",
        f"- Analyses completed: **{len(report)}**",
        f"- Failures: **{len(failures)}**",
        "- Mode: **read-only** — no alerts were modified or dismissed.",
        "",
    ]
    for item in report:
        analysis = item["analysis"]
        md.extend([
            f"## Alert #{item['alert_number']} — `{item['rule_id']}`",
            "",
            f"- Location: `{item['path']}:{item['line']}`",
            f"- Verdict: **{analysis['verdict']}**",
            f"- Confidence: **{analysis['confidence']:.0%}**",
            f"- Severity: **{analysis['severity']}**",
            f"- Exploitability: **{analysis['exploitability']}**",
            f"- Tenant-boundary risk: **{analysis['tenant_boundary_risk']}**",
            f"- Context sufficient: **{analysis['context_sufficient']}**",
            f"- Human review required: **{analysis['requires_human_review']}**",
            "",
            f"**Rationale:** {analysis['rationale']}",
            "",
            f"**Attack path:** {analysis['attack_path']}",
            "",
            "### Evidence",
            *[f"- {item}" for item in analysis["evidence"]],
            "",
            "### Recommended fix",
            *[f"- {item}" for item in analysis["recommended_fix"]],
            "",
            "### Required tests",
            *[f"- {item}" for item in analysis["tests_required"]],
            "",
            "### Missing context",
            *[f"- {item}" for item in analysis["missing_context"]] or ["- None identified."],
            "",
        ])
    if failures:
        md.extend(["## Analysis failures", "", *[f"- Alert #{x['alert_number']}: {x['error']}" for x in failures], ""])
    (OUTPUT_DIR / "report.md").write_text("\n".join(md), encoding="utf-8")

    print(f"Completed read-only security analysis: {len(report)}/{len(alerts)}")
    return 0 if not failures else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except APIError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
