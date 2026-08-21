import { describe, expect, it, vi } from "vitest";
import { UserRole } from "@school-erp/shared";
import { requirePermission } from "./rbac.js";

function createResponse() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
}

function principal() {
  return { userId: "principal-1", email: "principal@example.com", role: UserRole.PRINCIPAL, schoolId: "school-1" };
}

describe("requirePermission", () => {
  it("allows a principal to access dashboard reports", () => {
    const req = { user: principal() } as any;
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
    const req = { user: principal() } as any;
    const res = createResponse();
    const next = vi.fn();
    requirePermission("settings:write")(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("allows a principal to read and manage users according to the shared permission map", () => {
    const req = { user: principal() } as any;
    const readRes = createResponse();
    const readNext = vi.fn();
    requirePermission("users:read")(req, readRes, readNext);
    expect(readNext).toHaveBeenCalledOnce();

    const writeRes = createResponse();
    const writeNext = vi.fn();
    requirePermission("users:write")(req, writeRes, writeNext);
    expect(writeNext).toHaveBeenCalledOnce();
  });

  it("allows a principal to read payments but not collect payments", () => {
    const req = { user: principal() } as any;
    const readRes = createResponse();
    const readNext = vi.fn();
    requirePermission("payments:read")(req, readRes, readNext);
    expect(readNext).toHaveBeenCalledOnce();

    const writeRes = createResponse();
    const writeNext = vi.fn();
    requirePermission("payments:write")(req, writeRes, writeNext);
    expect(writeNext).not.toHaveBeenCalled();
    expect(writeRes.status).toHaveBeenCalledWith(403);
  });

  it("allows an accountant to collect payments", () => {
    const req = { user: { userId: "accountant-1", email: "accountant@example.com", role: UserRole.ACCOUNTANT, schoolId: "school-1" } } as any;
    const res = createResponse();
    const next = vi.fn();
    requirePermission("payments:write")(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("denies a teacher from managing users", () => {
    const req = { user: { userId: "teacher-1", email: "teacher@example.com", role: UserRole.TEACHER, schoolId: "school-1" } } as any;
    const res = createResponse();
    const next = vi.fn();
    requirePermission("users:write")(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
