#!/usr/bin/env python3
"""Read-only GitHub Code Scanning -> NVIDIA Nemotron security alert analyzer."""
from __future__ import annotations
import base64, json, os, re, sys, time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

GITHUB_API = "https://api.github.com"
NVIDIA_API = "https://integrate.api.nvidia.com/v1/chat/completions"
OWNER, REPO = "araj3539", "school-erp"
MODEL = "nvidia/nemotron-3-ultra-550b-a55b"
API_VERSION = "2026-03-10"
OUTPUT_DIR = Path("security-alert-analysis")
SOURCE_CONTEXT_LINES, MAX_SOURCE_CHARS, MAX_ALERTS = 80, 24000, 20

class APIError(RuntimeError):
    pass

def request_json(url: str, token: str) -> Any:
    request = Request(url, headers={"Accept":"application/vnd.github+json","Authorization":f"Bearer {token}","X-GitHub-Api-Version":API_VERSION,"User-Agent":"school-erp-security-alert-analyzer"}, method="GET")
    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise APIError(f"GitHub API {exc.code}: {exc.read().decode('utf-8', errors='replace')[:2000]}") from exc
    except URLError as exc:
        raise APIError(f"GitHub API connection failed: {exc}") from exc

def extract_json_object(text: str) -> dict[str, Any]:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.IGNORECASE)
    try:
        value = json.loads(cleaned)
        if isinstance(value, dict): return value
    except json.JSONDecodeError: pass
    decoder = json.JSONDecoder()
    for index, char in enumerate(cleaned):
        if char != "{": continue
        try: value, _ = decoder.raw_decode(cleaned[index:])
        except json.JSONDecodeError: continue
        if isinstance(value, dict): return value
    raise APIError(f"NVIDIA returned non-JSON structured output: {cleaned[:2000]}")

def validate_analysis(value: dict[str, Any]) -> dict[str, Any]:
    required = {"verdict","confidence","severity","exploitability","tenant_boundary_risk","context_sufficient","requires_human_review","rationale","attack_path","evidence","recommended_fix","tests_required","missing_context"}
    missing = sorted(required - value.keys())
    if missing: raise APIError(f"NVIDIA analysis is missing required fields: {', '.join(missing)}")
    if value["verdict"] not in {"true_positive","false_positive","needs_investigation"}: raise APIError("Invalid verdict")
    if not isinstance(value["confidence"], (int,float)) or not 0 <= value["confidence"] <= 1: raise APIError("Invalid confidence")
    return value

def nvidia_json(instructions: str, evidence: dict[str, Any], api_key: str) -> dict[str, Any]:
    shape = '''Return ONLY valid JSON with exactly these fields: verdict (true_positive|false_positive|needs_investigation), confidence (0..1), severity (critical|high|medium|low|informational|unknown), exploitability (high|moderate|low|none|unknown), tenant_boundary_risk (high|moderate|low|none|unknown), context_sufficient (boolean), requires_human_review (boolean), rationale (string), attack_path (string), evidence (string array), recommended_fix (string array), tests_required (string array), missing_context (string array). Do not use Markdown fences.'''
    prompt = f"{instructions}\n\n{shape}\n\nAlert evidence JSON:\n{json.dumps(evidence, ensure_ascii=False)}"
    payload = {"model":MODEL,"messages":[{"role":"system","content":"You are a senior application security reviewer. Output JSON only."},{"role":"user","content":prompt}],"temperature":0.1,"top_p":0.9,"max_tokens":12000,"stream":False,"seed":42,"chat_template_kwargs":{"enable_thinking":True,"medium_effort":True}}
    request = Request(NVIDIA_API, headers={"Authorization":f"Bearer {api_key}","Content-Type":"application/json","Accept":"application/json","User-Agent":"school-erp-security-alert-analyzer"}, method="POST", data=json.dumps(payload).encode("utf-8"))
    try:
        with urlopen(request, timeout=180) as response: result = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc: raise APIError(f"NVIDIA API {exc.code}: {exc.read().decode('utf-8', errors='replace')[:3000]}") from exc
    except URLError as exc: raise APIError(f"NVIDIA API connection failed: {exc}") from exc
    try: content = result["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc: raise APIError(f"NVIDIA response missing assistant content: {json.dumps(result)[:2000]}") from exc
    return validate_analysis(extract_json_object(content))

def github_alerts(token: str, ref: str, state: str, updated_after: str | None = None, alert_numbers: set[int] | None = None) -> list[dict[str, Any]]:
    if alert_numbers:
        alerts = []
        for number in sorted(alert_numbers):
            alert = request_json(f"{GITHUB_API}/repos/{OWNER}/{REPO}/code-scanning/alerts/{number}", token)
            if isinstance(alert, dict) and alert.get("state") == state:
                alerts.append(alert)
        return alerts[:MAX_ALERTS]

    alerts: list[dict[str, Any]] = []
    for page in range(1,101):
        params = {"state":state,"per_page":"100","page":str(page),"sort":"updated","direction":"desc"}
        if ref: params["ref"] = ref
        items = request_json(f"{GITHUB_API}/repos/{OWNER}/{REPO}/code-scanning/alerts?{urlencode(params)}", token)
        if not isinstance(items, list): raise APIError("Unexpected code-scanning alerts response")
        for item in items:
            if updated_after and (item.get("updated_at") or "") < updated_after:
                return alerts[:MAX_ALERTS]
            alerts.append(item)
            if len(alerts) >= MAX_ALERTS: return alerts
        if len(items) < 100: break
    return alerts[:MAX_ALERTS]

def github_file(token: str, path: str, ref: str) -> str:
    data = request_json(f"{GITHUB_API}/repos/{OWNER}/{REPO}/contents/{quote(path, safe='/')}?ref={quote(ref, safe='')}", token)
    if not isinstance(data, dict) or data.get("encoding") != "base64": raise APIError(f"Could not retrieve text source file {path}")
    try: return base64.b64decode(data["content"]).decode("utf-8")
    except (ValueError, UnicodeDecodeError) as exc: raise APIError(f"Source file {path} is not UTF-8 text") from exc

def redact(text: str) -> str:
    for pattern, replacement in [
        (r"(?i)(authorization\s*[:=]\s*bearer\s+)[A-Za-z0-9._-]+",r"\1[REDACTED]"),
        (r"(?i)(api[_-]?key\s*[:=]\s*)[A-Za-z0-9._-]{16,}",r"\1[REDACTED]"),
        (r"(?i)(secret[_-]?key\s*[:=]\s*)[A-Za-z0-9._-]{16,}",r"\1[REDACTED]"),
        (r"(?i)(password\s*[:=]\s*)[^\s,;]+",r"\1[REDACTED]")]:
        text = re.sub(pattern, replacement, text)
    return text

def source_context(source: str, start: int, end: int) -> str:
    lines = source.splitlines(); start, end = max(1,start-SOURCE_CONTEXT_LINES), min(len(lines),end+SOURCE_CONTEXT_LINES)
    text = redact("\n".join(f"{n:6d} | {lines[n-1]}" for n in range(start,end+1)))
    return text[:MAX_SOURCE_CHARS] + ("\n[context truncated]" if len(text)>MAX_SOURCE_CHARS else "")

def build_input(alert: dict[str,Any], context: str, target_ref: str) -> dict[str,Any]:
    instance, rule, tool = alert.get("most_recent_instance") or {}, alert.get("rule") or {}, alert.get("tool") or {}
    return {"repository":f"{OWNER}/{REPO}","target_ref":target_ref,"alert":{"number":alert.get("number"),"state":alert.get("state"),"html_url":alert.get("html_url"),"rule":{k:rule.get(k) for k in ("id","name","description","full_description","severity","security_severity_level","tags")},"tool":{"name":tool.get("name"),"version":tool.get("version")},"instance":{"ref":instance.get("ref"),"commit_sha":instance.get("commit_sha"),"message":instance.get("message"),"location":instance.get("location") or {},"classifications":instance.get("classifications",[])}},"source_context":context}

def main() -> int:
    github_token, nvidia_key = os.environ.get("GITHUB_TOKEN"), os.environ.get("NVIDIA_API_KEY")
    target_ref, alert_state = os.environ.get("TARGET_REF","refs/heads/main"), os.environ.get("ALERT_STATE","open")
    updated_after = os.environ.get("UPDATED_AFTER") or None
    raw_numbers = [x.strip() for x in os.environ.get("ALERT_NUMBERS","").split(",") if x.strip()]
    try: alert_numbers = {int(x) for x in raw_numbers}
    except ValueError as exc: raise APIError("ALERT_NUMBERS must be a comma-separated list of integers") from exc
    if not github_token: raise APIError("GITHUB_TOKEN is required")
    if not nvidia_key: raise APIError("NVIDIA_API_KEY GitHub Actions secret is required")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True); alerts = github_alerts(github_token,target_ref,alert_state,updated_after,alert_numbers)
    instructions = """Analyze this GitHub Code Scanning alert as a senior application security reviewer. Use only supplied alert metadata and source context. Do not assume missing code. Trace data flow toward the security-sensitive sink. Distinguish scanner suspicion from demonstrated exploitability. If validation, authorization, tenant isolation, or sanitization is missing, choose needs_investigation and context_sufficient=false. For this multi-tenant ERP, explicitly assess school/tenant-boundary impact. Do not recommend dismissal unless evidence supports it. This is read-only triage and every conclusion must be evidence-based."""
    report, failures = [], []
    for index, alert in enumerate(alerts,1):
        instance, location = alert.get("most_recent_instance") or {}, (alert.get("most_recent_instance") or {}).get("location") or {}
        path, start, end, commit = location.get("path"), int(location.get("start_line") or 1), int(location.get("end_line") or location.get("start_line") or 1), instance.get("commit_sha") or ""
        source, context_error = "", None
        if path and commit:
            try: source = github_file(github_token,path,commit)
            except APIError as exc: context_error = str(exc)
        else: context_error = "Alert did not provide a source path and commit SHA"
        evidence = build_input(alert, source_context(source,start,end) if source else "[source context unavailable]",target_ref)
        if context_error: evidence["source_context_error"] = context_error
        try:
            analysis = nvidia_json(instructions,evidence,nvidia_key)
            report.append({"alert_number":alert.get("number"),"rule_id":(alert.get("rule") or {}).get("id"),"path":path,"line":start,"analysis":analysis})
        except APIError as exc: failures.append({"alert_number":alert.get("number"),"error":str(exc)})
        print(f"Analyzed {index}/{len(alerts)} alert(s)",flush=True); time.sleep(0.25)
    result={"schema_version":1,"repository":f"{OWNER}/{REPO}","target_ref":target_ref,"alert_state":alert_state,"updated_after":updated_after,"alert_numbers":sorted(alert_numbers),"model":MODEL,"generated_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"alerts_seen":len(alerts),"analyses_completed":len(report),"analysis_failures":failures,"analyses":report,"read_only":True}
    (OUTPUT_DIR/"report.json").write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding="utf-8")
    markdown=["# AI Security Alert Analysis","",f"- Repository: `{OWNER}/{REPO}`",f"- Ref: `{target_ref}`",f"- Alert state: `{alert_state}`",f"- Updated after: `{updated_after or 'none'}`",f"- Explicit alert numbers: `{','.join(map(str, sorted(alert_numbers))) if alert_numbers else 'none'}`",f"- Model: `{MODEL}`",f"- Alerts selected: **{len(alerts)}**",f"- Analyses completed: **{len(report)}**",f"- Failures: **{len(failures)}**","- Mode: **read-only** — no alerts were modified or dismissed.",""]
    for item in report:
        a=item["analysis"]; markdown += [f"## Alert #{item['alert_number']} — `{item['rule_id']}`","",f"- Location: `{item['path']}:{item['line']}`",f"- Verdict: **{a['verdict']}**",f"- Confidence: **{a['confidence']:.0%}**",f"- Severity: **{a['severity']}**",f"- Exploitability: **{a['exploitability']}**",f"- Tenant-boundary risk: **{a['tenant_boundary_risk']}**",f"- Context sufficient: **{a['context_sufficient']}**",f"- Human review required: **{a['requires_human_review']}**","",f"**Rationale:** {a['rationale']}","",f"**Attack path:** {a['attack_path']}","","### Evidence"] + [f"- {x}" for x in a["evidence"]] + ["","### Recommended fix"] + [f"- {x}" for x in a["recommended_fix"]] + ["","### Required tests"] + [f"- {x}" for x in a["tests_required"]] + ["","### Missing context"] + ([f"- {x}" for x in a["missing_context"]] if a["missing_context"] else ["- None identified."]) + [""]
    if failures: markdown += ["## Analysis failures","",*[f"- Alert #{x['alert_number']}: {x['error']}" for x in failures],""]
    (OUTPUT_DIR/"report.md").write_text("\n".join(markdown),encoding="utf-8")
    print(f"Completed read-only security analysis: {len(report)}/{len(alerts)}")
    return 0 if not failures else 1

if __name__ == "__main__":
    try: raise SystemExit(main())
    except APIError as exc: print(f"ERROR: {exc}",file=sys.stderr); raise SystemExit(1)
