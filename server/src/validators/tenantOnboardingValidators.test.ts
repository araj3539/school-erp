import { describe, expect, it } from "vitest";
import { TenantOnboardingSchema } from "./tenantOnboardingValidators.js";

const valid = {
  idempotencyKey: "onboard-school-2026-001",
  name: "Example School",
  address: "1 School Road, Patna",
  phone: "+919999999999",
  email: "school@example.com",
  session: "2026-27",
  academicYear: { name: "2026-27", startDate: "2026-04-01T00:00:00+05:30", endDate: "2027-03-31T23:59:59+05:30" },
  admin: { email: "principal@example.com", password: "StrongPassword123!" },
};

describe("TenantOnboardingSchema", () => {
  it("normalizes email addresses", () => {
    const result = TenantOnboardingSchema.parse({ ...valid, email: " SCHOOL@EXAMPLE.COM ", admin: { ...valid.admin, email: " PRINCIPAL@EXAMPLE.COM " } });
    expect(result.email).toBe("school@example.com");
    expect(result.admin.email).toBe("principal@example.com");
  });

  it("requires a strong idempotency key and admin password", () => {
    expect(TenantOnboardingSchema.safeParse({ ...valid, idempotencyKey: "short" }).success).toBe(false);
    expect(TenantOnboardingSchema.safeParse({ ...valid, admin: { ...valid.admin, password: "short" } }).success).toBe(false);
  });

  it("rejects an academic year whose end is not after its start", () => {
    expect(TenantOnboardingSchema.safeParse({ ...valid, academicYear: { ...valid.academicYear, endDate: valid.academicYear.startDate } }).success).toBe(false);
  });

  it("rejects malformed email and missing tenant identity", () => {
    expect(TenantOnboardingSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
    expect(TenantOnboardingSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });
});
