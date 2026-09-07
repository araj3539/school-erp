import { describe, expect, it } from "vitest";
import { Staff } from "./Staff.js";

describe("Staff persistence invariants", () => {
  it("requires tenant ownership and keeps employee IDs tenant-scoped", () => {
    const schoolId = Staff.schema.path("schoolId");
    const employeeId = Staff.schema.path("employeeId");
    const employeeIndex = Staff.schema.indexes().find(([fields]) => fields.schoolId === 1 && fields.employeeId === 1);

    expect(schoolId.options.required).toBe(true);
    expect(employeeId.options.required).toBe(true);
    expect(employeeIndex?.[1]).toMatchObject({ unique: true });
  });

  it("indexes staff lifecycle and tenant-local lookup fields", () => {
    const indexes = Staff.schema.indexes();
    expect(indexes.some(([fields]) => fields.schoolId === 1 && fields.status === 1 && fields.department === 1)).toBe(true);
    expect(indexes.some(([fields]) => fields.schoolId === 1 && fields.createdAt === -1)).toBe(true);
  });
});
