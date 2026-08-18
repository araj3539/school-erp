import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { getTenantId, withTenant } from "./tenant.js";

function requestWithUser(schoolId?: string) {
  return { user: schoolId ? { schoolId } : undefined } as unknown as Request;
}

describe("tenant helpers", () => {
  it("returns the school id from the authenticated user", () => {
    expect(getTenantId(requestWithUser("school-a"))).toBe("school-a");
  });

  it("rejects requests without a tenant context", () => {
    expect(() => getTenantId(requestWithUser())).toThrow("School context is required");
  });

  it("overrides a client-supplied school id", () => {
    const result = withTenant(requestWithUser("school-a"), {
      schoolId: "school-b",
      name: "Example"
    });

    expect(result).toEqual({ schoolId: "school-a", name: "Example" });
  });
});
