import { describe, expect, it } from "vitest";
import { FeeDefaulterQuerySchema, FeeReminderSchema } from "./feeOperations.js";

describe("fee operations validators", () => {
  it("normalizes defaulter pagination and accepts supported aging buckets", () => {
    const result = FeeDefaulterQuerySchema.parse({ page: "2", limit: "50", agingBucket: "31-60" });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
    expect(result.agingBucket).toBe("31-60");
  });

  it("rejects an invalid aging bucket", () => {
    expect(() => FeeDefaulterQuerySchema.parse({ agingBucket: "0-30" })).toThrow();
  });

  it("requires at least one student for reminder dispatch", () => {
    expect(() => FeeReminderSchema.parse({ studentIds: [] })).toThrow();
  });

  it("defaults reminder kind to overdue", () => {
    const result = FeeReminderSchema.parse({ studentIds: ["66c000000000000000000001"] });
    expect(result.kind).toBe("overdue");
  });
});
