import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../auth/api";
import { apiRequest } from "./client";

test("apiRequest retries read failures but not client errors", async () => {
  let attempts = 0;
  const result = await apiRequest(
    async <T>() => {
      attempts += 1;
      if (attempts < 2) throw new Error("temporary network failure");
      return { ok: true } as T;
    },
    "/health",
  );

  assert.deepEqual(result, { ok: true });
  assert.equal(attempts, 2);
});

test("apiRequest does not retry unsafe writes", async () => {
  let attempts = 0;
  await assert.rejects(
    () => apiRequest(async () => {
      attempts += 1;
      throw new Error("server unavailable");
    }, "/students", { method: "POST" }),
    /server unavailable/,
  );
  assert.equal(attempts, 1);
});

test("apiRequest preserves normalized 4xx errors", async () => {
  let attempts = 0;
  const error = new ApiError(403, "Forbidden", "FORBIDDEN");

  await assert.rejects(
    () => apiRequest(async () => {
      attempts += 1;
      throw error;
    }, "/students"),
    (received: unknown) => received === error,
  );
  assert.equal(attempts, 1);
});

test("apiRequest propagates caller cancellation without retrying", async () => {
  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    () => apiRequest(async () => {
      throw new Error("should not reach request");
    }, "/students", { signal: controller.signal }),
    (received: unknown) => received instanceof ApiError && received.status === 499,
  );
});
