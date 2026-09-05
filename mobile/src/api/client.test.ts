import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../auth/api";
import { apiRequest } from "./client";
import { normalizeApiError } from "./errors";
import { mobileQueryKeys } from "./queryKeys";

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

test("normalizeApiError classifies validation failures", () => {
  const normalized = normalizeApiError(new ApiError(422, "Invalid student data", "VALIDATION_ERROR"));
  assert.equal(normalized.kind, "validation");
  assert.equal(normalized.retryable, false);
});

test("normalizeApiError distinguishes expired sessions from unauthorized", () => {
  assert.equal(normalizeApiError(new ApiError(401, "Token expired", "TOKEN_EXPIRED")).kind, "session-expired");
  assert.equal(normalizeApiError(new ApiError(401, "Unauthorized")).kind, "unauthorized");
});

test("normalizeApiError classifies forbidden responses", () => {
  const normalized = normalizeApiError(new ApiError(403, "Forbidden", "FORBIDDEN"));
  assert.equal(normalized.kind, "forbidden");
  assert.equal(normalized.retryable, false);
});

test("normalizeApiError classifies server and network failures as retryable", () => {
  assert.equal(normalizeApiError(new ApiError(500, "Server error")).kind, "server");
  assert.equal(normalizeApiError(new Error("Network unavailable")).kind, "network");
  assert.equal(normalizeApiError(new ApiError(500, "Server error")).retryable, true);
});

test("normalizeApiError keeps timeout and cancellation non-interchangeable", () => {
  assert.equal(normalizeApiError(new ApiError(408, "Timed out")).kind, "timeout");
  assert.equal(normalizeApiError(new ApiError(499, "Cancelled")).kind, "cancelled");
  assert.equal(normalizeApiError(new ApiError(499, "Cancelled")).retryable, false);
});

test("mobile query keys include scope-changing identifiers", () => {
  assert.deepEqual(mobileQueryKeys.parentPortal("child-a"), ["mobile", "portal", "parent", "child-a"]);
  assert.notDeepEqual(mobileQueryKeys.parentPortal("child-a"), mobileQueryKeys.parentPortal("child-b"));
  assert.deepEqual(mobileQueryKeys.dashboard(), ["mobile", "dashboard"]);
});
