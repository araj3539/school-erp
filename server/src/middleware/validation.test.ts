import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validate } from "./validation.js";

async function runValidation(target: "body" | "query" | "params", request: Record<string, unknown>) {
  const next = vi.fn();
  await validate(z.object({ value: z.coerce.number().int().positive() }), target)(
    request as any,
    {} as any,
    next
  );
  return next;
}

describe("validate middleware", () => {
  it("validates and stores a parsed request body", async () => {
    const request = { body: { value: "4" }, query: {}, params: {} };
    const next = await runValidation("body", request);

    expect(request).toMatchObject({ validatedBody: { value: 4 } });
    expect(next).toHaveBeenCalledWith();
  });

  it("validates query parameters without reading the request body", async () => {
    const request = { body: {}, query: { value: "5" }, params: {} };
    const next = await runValidation("query", request);

    expect(request).toMatchObject({ validatedQuery: { value: 5 } });
    expect(next).toHaveBeenCalledWith();
  });

  it("passes validation failures to the error handler", async () => {
    const request = { body: {}, query: {}, params: { value: "not-a-number" } };
    const next = await runValidation("params", request);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
  });
});
