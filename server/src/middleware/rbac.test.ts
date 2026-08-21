import { describe, expect, it, vi } from "vitest";
import { UserRole } from "@school-erp/shared";
import { requirePermission } from "./rbac.js";

function createResponse() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
}

describe("requirePermission", () => {
  it("allows a principal to access dashboard reports", () => {
    const req = { user: { userId: "principal-1", email: "principal@example.com", role: UserRole.PRINCIPAL, schoolId: "school-1" } } as any;
    const res = createResponse();
    const next = vi.fn();

    requirePermission("reports:read")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("denies a student from accessing dashboard reports", () => {
    const req = { user: { userId: "student-1", email: "student@example.com", role: UserRole.STUDENT, schoolId: "school-1" } } as any;
    const res = createResponse();
    const next = vi.fn();

    requirePermission("reports:read")(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("denies a teacher from manually triggering storage backup", () => {
    const req = { user: { userId: "teacher-1", email: "teacher@example.com", role: UserRole.TEACHER, schoolId: "school-1" } } as any;
    const res = createResponse();
    const next = vi.fn();

    requirePermission("settings:write")(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("allows a principal to manually trigger storage backup", () => {
    const req = { user: { userId: "principal-1", email: "principal@example.com", role: UserRole.PRINCIPAL, schoolId: "school-1" } } as any;
    const res = createResponse();
    const next = vi.fn();

    requirePermission("settings:write")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
