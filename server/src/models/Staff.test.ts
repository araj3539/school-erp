import { describe, expect, it } from "vitest";
import { Staff } from "./Staff.js";

describe("Staff persistence invariants", () => {
  it("requires tenant ownership and keeps employee IDs tenant-scoped", () => {
    const schoolId = Staff.schema.path("schoolId");
    const employeeId = Staff.schema.path("employeeId");

    expect(schoolId.options.required).toBe(true);
    expect(employeeId.options.required).toBe(true);
    expect(Staff.schema.indexes()).toContainEqual([{ schoolId: 1, employeeId: 1 }, { unique: true }]);
  });

  it("indexes staff lifecycle and tenant-local lookup fields", () => {
    expect(Staff.schema.indexes()).toContainEqual([{ schoolId: 1, status: 1, department: 1 }, {}]);
    expect(Staff.schema.indexes()).toContainEqual([{ schoolId: 1, createdAt: -1 }, {}]);
  });
});
