import { describe, expect, it } from "vitest";
import { ROLE_PERMISSIONS, UserRole } from "./index.js";

describe("role permission boundaries", () => {
  it("keeps super admin unrestricted at the permission layer", () => {
    expect(ROLE_PERMISSIONS[UserRole.SUPER_ADMIN]).toEqual(["*"]);
  });

  it("keeps principal management permissions separate from financial collection", () => {
    expect(ROLE_PERMISSIONS[UserRole.PRINCIPAL]).toContain("fees:write");
    expect(ROLE_PERMISSIONS[UserRole.PRINCIPAL]).toContain("payments:read");
    expect(ROLE_PERMISSIONS[UserRole.PRINCIPAL]).not.toContain("payments:write");
  });

  it("limits accountants to financial operations rather than student administration", () => {
    expect(ROLE_PERMISSIONS[UserRole.ACCOUNTANT]).toContain("payments:write");
    expect(ROLE_PERMISSIONS[UserRole.ACCOUNTANT]).not.toContain("students:write");
    expect(ROLE_PERMISSIONS[UserRole.ACCOUNTANT]).not.toContain("users:write");
  });

  it("limits teachers to assigned-class workflows", () => {
    expect(ROLE_PERMISSIONS[UserRole.TEACHER]).toContain("attendance:write");
    expect(ROLE_PERMISSIONS[UserRole.TEACHER]).toContain("students:read");
    expect(ROLE_PERMISSIONS[UserRole.TEACHER]).toContain("marks:write");
    expect(ROLE_PERMISSIONS[UserRole.TEACHER]).not.toContain("exams:read");
    expect(ROLE_PERMISSIONS[UserRole.TEACHER]).not.toContain("results:read");
    expect(ROLE_PERMISSIONS[UserRole.TEACHER]).not.toContain("students:write");
    expect(ROLE_PERMISSIONS[UserRole.TEACHER]).not.toContain("users:write");
  });

  it("keeps student and parent child permissions distinct from broad reads", () => {
    expect(ROLE_PERMISSIONS[UserRole.STUDENT]).toContain("students:read:own");
    expect(ROLE_PERMISSIONS[UserRole.STUDENT]).not.toContain("students:read");
    expect(ROLE_PERMISSIONS[UserRole.PARENT]).toContain("students:read:child");
    expect(ROLE_PERMISSIONS[UserRole.PARENT]).not.toContain("students:read");
  });
});
