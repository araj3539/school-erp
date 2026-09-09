import { describe, expect, it } from "vitest";
import { MODULES, isModuleId } from "./moduleEntitlement.js";

describe("module entitlement catalog", () => {
  it("exposes stable module identifiers with enabled defaults", () => {
    expect(MODULES.students).toBe(true);
    expect(MODULES.academics).toBe(true);
    expect(MODULES.reports).toBe(true);
    expect(MODULES.academicYears).toBe(true);
  });

  it("accepts only registered module identifiers", () => {
    expect(isModuleId("students")).toBe(true);
    expect(isModuleId("fees")).toBe(true);
    expect(isModuleId("unknown")).toBe(false);
  });
});
