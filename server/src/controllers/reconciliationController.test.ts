import { describe, expect, it } from "vitest";
import { DateRangeSchema } from "../validators/index.js";

describe("financial reconciliation boundaries", () => {
  it("accepts the same start and end instant", () => {
    expect(DateRangeSchema.parse({ startDate: "2026-09-02T00:00:00.000Z", endDate: "2026-09-02T00:00:00.000Z" })).toEqual({ startDate: "2026-09-02T00:00:00.000Z", endDate: "2026-09-02T00:00:00.000Z" });
  });

  it("rejects an end instant before the start instant", () => {
    expect(() => DateRangeSchema.parse({ startDate: "2026-09-02T00:00:01.000Z", endDate: "2026-09-02T00:00:00.000Z" })).toThrow();
  });
});
