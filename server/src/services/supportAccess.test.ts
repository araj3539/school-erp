import { describe, expect, it, vi } from "vitest";
import { UserRole } from "@school-erp/shared";
import { ROLE_PERMISSIONS } from "@school-erp/shared";
import { requireRole } from "../middleware/auth.js";
import { SupportDiagnosticSchema, SupportTenantParamSchema } from "../validators/supportAccessValidators.js";

function response() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
}

describe("audited support access", () => {
  it("defines support as a separate least-privilege role", () => {
    expect(UserRole.SUPPORT_ADMIN).toBe("support_admin");
    expect(ROLE_PERMISSIONS[UserRole.SUPPORT_ADMIN]).toEqual(["support:read"]);
    expect(ROLE_PERMISSIONS[UserRole.SUPPORT_ADMIN]).not.toContain("users:write");
    expect(ROLE_PERMISSIONS[UserRole.SUPPORT_ADMIN]).not.toContain("payments:write");
  });

  it("allows the support role through its role boundary", () => {
    const req = { user: { userId: "support-1", email: "support@example.com", role: UserRole.SUPPORT_ADMIN } } as any;
    const res = response();
    const next = vi.fn();
    requireRole(UserRole.SUPPORT_ADMIN)(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects school administrators from support routes", () => {
    const req = { user: { userId: "principal-1", email: "principal@example.com", role: UserRole.PRINCIPAL, schoolId: "507f1f77bcf86cd799439011" } } as any;
    const res = response();
    const next = vi.fn();
    requireRole(UserRole.SUPPORT_ADMIN)(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("requires an explicit tenant id and non-trivial reason", () => {
    expect(SupportTenantParamSchema.safeParse({ schoolId: "507f1f77bcf86cd799439011" }).success).toBe(true);
    expect(SupportTenantParamSchema.safeParse({ schoolId: "not-an-id" }).success).toBe(false);
    expect(SupportDiagnosticSchema.safeParse({ reason: "Investigate tenant login issue" }).success).toBe(true);
    expect(SupportDiagnosticSchema.safeParse({ reason: "debug" }).success).toBe(false);
  });
});
