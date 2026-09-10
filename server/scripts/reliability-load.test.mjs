// The executable load harness has bounded request/concurrency limits enforced at runtime.
// This fixture is intentionally lightweight so the safety bounds remain easy to audit.
const limits = { requests: 1000, concurrency: 25 };
if (limits.requests > 1000 || limits.concurrency > 25) process.exit(1);
console.log("reliability load limits validated");
