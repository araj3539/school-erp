import { describe, expect, it, vi } from "vitest";
import { UserRole } from "@school-erp/shared";
import { requirePlatformRole } from "./auth.js";

function response() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
}

describe("platform authorization boundary", () => {
  it("allows only an unscoped super-admin context", () => {
    const next = vi.fn();
    requirePlatformRole({ user: { userId: "1", email: "admin@example.com", role: UserRole.SUPER_ADMIN } } as any, response(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects a super-admin request that has selected a school", () => {
    const next = vi.fn();
    const res = response();
    requirePlatformRole({ user: { userId: "1", email: "admin@example.com", role: UserRole.SUPER_ADMIN, schoolId: "507f1f77bcf86cd799439011" } } as any, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects every school role from platform routes", () => {
    for (const role of [UserRole.PRINCIPAL, UserRole.ACCOUNTANT, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT]) {
      const next = vi.fn();
      const res = response();
      requirePlatformRole({ user: { userId: "1", email: "user@example.com", role, schoolId: "507f1f77bcf86cd799439011" } } as any, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    }
  });
});
