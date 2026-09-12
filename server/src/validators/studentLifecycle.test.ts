import { describe, expect, it } from "vitest";
import { StudentLifecycleTransitionSchema, UpdateStudentLifecycleSafeSchema } from "./index.js";
import { StudentStatus } from "@school-erp/shared";

describe("student lifecycle validators", () => {
  it("requires a meaningful reason and accepts an effective timestamp", () => {
    const result = StudentLifecycleTransitionSchema.safeParse({
      toStatus: StudentStatus.TRANSFERRED,
      reason: "Transferred to another school",
      effectiveAt: "2026-09-12T10:00:00.000Z"
    });
    expect(result.success).toBe(true);
  });

  it("rejects blank lifecycle reasons", () => {
    const result = StudentLifecycleTransitionSchema.safeParse({ toStatus: StudentStatus.LEFT, reason: "  " });
    expect(result.success).toBe(false);
  });

  it("does not allow generic student updates to mutate lifecycle status", () => {
    const result = UpdateStudentLifecycleSafeSchema.safeParse({ status: StudentStatus.LEFT });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).not.toHaveProperty("status");
  });
});
