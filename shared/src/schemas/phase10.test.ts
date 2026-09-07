import { describe, expect, it } from "vitest";
import { CreateStaffSchema, StaffQuerySchema, StaffStatus } from "./phase10.js";

describe("Phase 10 staff contracts", () => {
  it("requires the core staff identity and employment fields", () => {
    const result = CreateStaffSchema.safeParse({
      firstName: "Anita",
      lastName: "Sharma",
      email: "anita@example.com",
      phone: "9876543210",
      department: "Administration",
      designation: "Office Manager",
      employmentType: "full_time",
      joiningDate: "2026-09-01"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe(StaffStatus.ACTIVE);
      expect(result.data.salary).toBe(0);
    }
  });

  it("rejects malformed dates and negative salary", () => {
    const result = CreateStaffSchema.safeParse({
      employeeId: "EMP-1",
      firstName: "Anita",
      lastName: "Sharma",
      email: "anita@example.com",
      phone: "9876543210",
      department: "Administration",
      designation: "Office Manager",
      employmentType: "full_time",
      joiningDate: "01-09-2026",
      salary: -1
    });

    expect(result.success).toBe(false);
  });

  it("limits list filters to the supported staff lifecycle states", () => {
    expect(StaffQuerySchema.safeParse({ status: "active", page: 1, limit: 20 }).success).toBe(true);
    expect(StaffQuerySchema.safeParse({ status: "terminated" }).success).toBe(false);
  });
});
