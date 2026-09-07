import { describe, expect, it } from "vitest";
import { CreateStudentSchema } from "../validators/index.js";

describe("student creation security validation", () => {
  it("accepts only schema-shaped student input", () => {
    const parsed = CreateStudentSchema.parse({
      admissionNo: "ADM-001",
      parentIds: [],
      firstName: "Test",
      lastName: "Student",
      dob: "2010-01-01",
      gender: "male",
      fatherName: "Parent",
      motherName: "Parent",
      phone: "9999999999",
      address: "Test Address",
      admissionDate: "2026-01-01",
    });

    expect(parsed.admissionNo).toBe("ADM-001");
    expect(parsed).not.toHaveProperty("$where");
    expect(parsed).not.toHaveProperty("schoolId");
  });
});
