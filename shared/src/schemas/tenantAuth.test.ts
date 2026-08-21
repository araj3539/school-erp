import { describe, expect, it } from "vitest";
import { CreateSchoolSchema, LoginSchema, SchoolCodeSchema } from "./index";

describe("tenant authentication schemas", () => {
  it("normalizes school codes to uppercase", () => {
    const result = SchoolCodeSchema.safeParse("  sch-abc123  ");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("SCH-ABC123");
  });

  it("allows super-admin login without a school code", () => {
    expect(LoginSchema.safeParse({
      email: "super@platform.com",
      password: "password123"
    }).success).toBe(true);
  });

  it("allows tenant login with a school code", () => {
    const result = LoginSchema.safeParse({
      email: "admin@school.com",
      password: "password123",
      schoolCode: "sch-demo01"
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.schoolCode).toBe("SCH-DEMO01");
  });

  it("does not allow callers to set a generated school code when creating a school", () => {
    const result = CreateSchoolSchema.safeParse({
      code: "SCH-MANUAL",
      name: "Test School",
      address: "123 School Street",
      phone: "1234567890",
      email: "admin@testschool.com",
      session: "2026-27",
      academicYear: "507f1f77bcf86cd799439011"
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).not.toHaveProperty("code");
  });
});
