const baseUrl = (process.env.RELIABILITY_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
const totalRequests = Number(process.env.RELIABILITY_REQUESTS ?? 100);
const concurrency = Number(process.env.RELIABILITY_CONCURRENCY ?? 10);
const timeoutMs = Number(process.env.RELIABILITY_TIMEOUT_MS ?? 8000);

if (!Number.isInteger(totalRequests) || totalRequests < 1 || totalRequests > 1000) throw new Error("RELIABILITY_REQUESTS must be 1..1000");
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 25) throw new Error("RELIABILITY_CONCURRENCY must be 1..25");

async function probe(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      signal: controller.signal,
      headers: { "x-request-id": `reliability-load-${Date.now()}-${Math.random().toString(16).slice(2)}` },
    });
    await response.arrayBuffer();
    return { status: response.status, elapsedMs: performance.now() - startedAt };
  } finally {
    clearTimeout(timer);
  }
}

const paths = ["/health", "/ready"];
const results = [];
let nextIndex = 0;

async function worker() {
  while (true) {
    const index = nextIndex++;
    if (index >= totalRequests) return;
    const path = paths[index % paths.length];
    try {
      results[index] = { path, ...(await probe(path)) };
    } catch (error) {
      results[index] = { path, status: 0, elapsedMs: Infinity, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, totalRequests) }, worker));

const latencies = results.filter((result) => Number.isFinite(result.elapsedMs)).map((result) => result.elapsedMs).sort((a, b) => a - b);
const percentile = (p) => latencies.length ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))] : Infinity;
const failures = results.filter((result) => result.status === 0 || result.status >= 500);
const summary = {
  event: "reliability_load",
  baseUrl,
  requests: totalRequests,
  concurrency,
  failures: failures.length,
  p50Ms: Math.round(percentile(0.50)),
  p95Ms: Math.round(percentile(0.95)),
  p99Ms: Math.round(percentile(0.99)),
  statusCounts: results.reduce((counts, result) => {
    const key = String(result.status);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {}),
};

console.log(JSON.stringify(summary));
if (failures.length) {
  console.error(JSON.stringify({ event: "reliability_load_failed", failures: failures.slice(0, 10) }));
  process.exit(1);
}
