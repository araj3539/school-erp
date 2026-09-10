const baseUrl = (process.env.RELIABILITY_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
const timeoutMs = Number(process.env.RELIABILITY_TIMEOUT_MS ?? 8000);

async function fetchWithTimeout(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      signal: controller.signal,
      headers: { "x-request-id": `reliability-smoke-${Date.now()}` },
    });
    const body = await response.json().catch(() => null);
    return {
      path,
      status: response.status,
      elapsedMs: Math.round(performance.now() - startedAt),
      requestId: response.headers.get("x-request-id"),
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

const results = [];
for (const path of ["/health", "/ready"]) {
  try {
    results.push(await fetchWithTimeout(path));
  } catch (error) {
    results.push({ path, status: 0, elapsedMs: 0, error: error instanceof Error ? error.message : String(error) });
  }
}

for (const result of results) console.log(JSON.stringify({ event: "reliability_smoke", ...result }));

const healthOk = results.find((result) => result.path === "/health")?.status === 200;
const readinessOk = results.find((result) => result.path === "/ready")?.status === 200;
const idsPresent = results.every((result) => result.requestId);

if (!healthOk || !readinessOk || !idsPresent) {
  console.error(JSON.stringify({ event: "reliability_smoke_failed", healthOk, readinessOk, idsPresent }));
  process.exit(1);
}

console.log(JSON.stringify({ event: "reliability_smoke_passed", baseUrl }));
