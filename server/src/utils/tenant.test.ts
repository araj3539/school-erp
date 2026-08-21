import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { UserRole } from "@school-erp/shared";
import { getTenantId, withTenant } from "./tenant.js";

function requestWithUser(schoolId?: string) {
  return { user: schoolId ? { schoolId } : undefined, get: () => undefined } as unknown as Request;
}

function superAdminRequest(selectedSchoolId?: string) {
  return { user: { userId: "platform-admin", email: "admin@example.com", role: UserRole.SUPER_ADMIN }, get: (name: string) => name === "X-School-Id" ? selectedSchoolId : undefined } as unknown as Request;
}

describe("tenant helpers", () => {
  it("returns the school id from the authenticated school user", () => {
    expect(getTenantId(requestWithUser("school-a"))).toBe("school-a");
  });

  it("rejects requests without a tenant context", () => {
    expect(() => getTenantId(requestWithUser())).toThrow("School context is required");
  });

  it("uses the explicit selected school for a super admin", () => {
    expect(getTenantId(superAdminRequest("66c000000000000000000001"))).toBe("66c000000000000000000001");
  });

  it("rejects a super admin request without a selected school", () => {
    expect(() => getTenantId(superAdminRequest())).toThrow("Select a school");
  });

  it("rejects an invalid super admin school selection", () => {
    expect(() => getTenantId(superAdminRequest("not-an-object-id"))).toThrow("Invalid selected school");
  });

  it("overrides a client-supplied school id", () => {
    const result = withTenant(requestWithUser("school-a"), { schoolId: "school-b", name: "Example" });
    expect(result).toEqual({ schoolId: "school-a", name: "Example" });
  });
});
