import { describe, expect, it } from "vitest";
import { StudentLifecycleTransitionSchema, UpdateStudentLifecycleSafeSchema } from "./studentLifecycle.js";
import { StudentStatus } from "@school-erp/shared";

describe("student lifecycle validators", () => {
  it("requires a meaningful reason and accepts an effective timestamp", () => {
    const result = StudentLifecycleTransitionSchema.safeParse({ toStatus: StudentStatus.TRANSFERRED, reason: "Transferred to another school", effectiveAt: "2026-09-12T10:00:00.000Z" });
    expect(result.success).toBe(true);
  });
  it("rejects blank lifecycle reasons", () => {
    expect(StudentLifecycleTransitionSchema.safeParse({ toStatus: StudentStatus.LEFT, reason: "  " }).success).toBe(false);
  });
  it("rejects lifecycle status in generic student updates", () => {
    expect(UpdateStudentLifecycleSafeSchema.safeParse({ status: StudentStatus.LEFT }).success).toBe(false);
  });
});
