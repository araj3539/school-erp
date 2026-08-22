import { describe, expect, it } from "vitest";
import { UpdateTenantUserSchema } from "./index.js";
import { UserRole } from "@school-erp/shared";

describe("tenant user update validation", () => {
  it("strips a client-supplied schoolId", () => {
    const result = UpdateTenantUserSchema.safeParse({
      email: "teacher@example.com",
      schoolId: "507f1f77bcf86cd799439011",
      role: UserRole.TEACHER,
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).not.toHaveProperty("schoolId");
  });

  it("rejects promotion to super admin", () => {
    const result = UpdateTenantUserSchema.safeParse({ role: UserRole.SUPER_ADMIN });
    expect(result.success).toBe(false);
  });

  it("accepts ordinary tenant role changes", () => {
    const result = UpdateTenantUserSchema.safeParse({ role: UserRole.ACCOUNTANT });
    expect(result.success).toBe(true);
  });
});
