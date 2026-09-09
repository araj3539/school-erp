import { describe, expect, it, vi } from "vitest";
import { ROLE_PERMISSIONS, UserRole } from "@school-erp/shared";

const schoolFindById = vi.hoisted(() => vi.fn());
vi.mock("../models/index.js", () => ({ School: { findById: schoolFindById } }));

import { requirePermission } from "./rbac.js";

function createResponse() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
}
function schoolQuery(tenantStatus: string | undefined) {
  return { select: () => ({ lean: vi.fn().mockResolvedValue({ tenantStatus }) }) };
}
function principal() {
  return { userId: "principal-1", email: "principal@example.com", role: UserRole.PRINCIPAL, schoolId: "507f1f77bcf86cd799439011" };
}

describe("requirePermission", () => {
  it("allows a principal to access dashboard reports for an active tenant", async () => {
    schoolFindById.mockReturnValue(schoolQuery("active"));
    const req = { user: principal() } as any;
    const res = createResponse();
    const next = vi.fn();
    await requirePermission("reports:read")(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("denies school authority for suspended and archived tenants", async () => {
    for (const tenantStatus of ["suspended", "archived"]) {
      schoolFindById.mockReturnValue(schoolQuery(tenantStatus));
      const req = { user: principal() } as any;
      const res = createResponse();
      const next = vi.fn();
      await requirePermission("reports:read")(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    }
  });

  it("treats a legacy school without tenantStatus as active until migration", async () => {
    schoolFindById.mockReturnValue(schoolQuery(undefined));
    const req = { user: principal() } as any;
    const res = createResponse();
    const next = vi.fn();
    await requirePermission("reports:read")(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("denies a student from accessing dashboard reports", () => {
    const req = { user: { userId: "student-1", email: "student@example.com", role: UserRole.STUDENT, schoolId: principal().schoolId } } as any;
    const res = createResponse();
    const next = vi.fn();
    requirePermission("reports:read")(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("denies a teacher from manually triggering storage backup", () => {
    const req = { user: { userId: "teacher-1", email: "teacher@example.com", role: UserRole.TEACHER, schoolId: principal().schoolId } } as any;
    const res = createResponse();
    const next = vi.fn();
    requirePermission("settings:write")(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("keeps parent-child student permission distinct from broad student reads", () => {
    expect(ROLE_PERMISSIONS[UserRole.PARENT]).toContain("students:read:child");
    expect(ROLE_PERMISSIONS[UserRole.PARENT]).not.toContain("students:read");
  });
});
