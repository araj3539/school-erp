import { describe, expect, it, vi } from "vitest";
import { logRequestCompletion, requestContext } from "./requestContext.js";

describe("requestContext", () => {
  it("generates and propagates a request ID when the client omits one", () => {
    const req = { get: vi.fn().mockReturnValue(undefined) } as any;
    const res = { setHeader: vi.fn() } as any;
    const next = vi.fn();

    requestContext(req, res, next);

    expect(req.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.setHeader).toHaveBeenCalledWith("x-request-id", req.requestId);
    expect(next).toHaveBeenCalledOnce();
  });

  it("accepts a bounded safe client request ID", () => {
    const requestId = "trace-123:abc";
    const req = { get: vi.fn().mockReturnValue(requestId) } as any;
    const res = { setHeader: vi.fn() } as any;
    const next = vi.fn();

    requestContext(req, res, next);

    expect(req.requestId).toBe(requestId);
    expect(res.setHeader).toHaveBeenCalledWith("x-request-id", requestId);
  });

  it("replaces unsafe request IDs instead of reflecting them", () => {
    const req = { get: vi.fn().mockReturnValue("<script>alert(1)</script>") } as any;
    const res = { setHeader: vi.fn() } as any;
    const next = vi.fn();

    requestContext(req, res, next);

    expect(req.requestId).not.toContain("<");
    expect(req.requestId).not.toContain(">");
    expect(res.setHeader).toHaveBeenCalledWith("x-request-id", req.requestId);
  });
});

describe("logRequestCompletion", () => {
  it("emits a structured request event without query-string data", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const req = { requestId: "trace-123", method: "GET", path: "/api/v1/students" } as any;
    const res = { statusCode: 200 } as any;

    logRequestCompletion(req, res, Date.now() - 12);

    expect(logSpy).toHaveBeenCalledOnce();
    const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(payload).toMatchObject({
      event: "http_request",
      requestId: "trace-123",
      method: "GET",
      path: "/api/v1/students",
      statusCode: 200,
    });
    expect(payload).not.toHaveProperty("query");
    logSpy.mockRestore();
  });
});
