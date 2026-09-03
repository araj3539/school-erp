import { describe, expect, it } from "vitest";
import { BulkAttendanceSchema } from "./index.js";

const id = "507f1f77bcf86cd799439011";
const entry = (date: string) => ({
  date,
  classId: id,
  sectionId: id,
  records: [{ studentId: id, status: "present" }],
});

describe("BulkAttendanceSchema", () => {
  it("accepts distinct attendance days", () => {
    expect(BulkAttendanceSchema.safeParse({ entries: [entry("2026-09-01"), entry("2026-09-02")] }).success).toBe(true);
  });

  it("rejects duplicate class-section-day entries", () => {
    const result = BulkAttendanceSchema.safeParse({ entries: [entry("2026-09-01"), entry("2026-09-01")] });
    expect(result.success).toBe(false);
  });

  it("rejects more than 31 entries", () => {
    const result = BulkAttendanceSchema.safeParse({ entries: Array.from({ length: 32 }, (_, index) => entry(`2026-09-${String(index + 1).padStart(2, "0")}`)) });
    expect(result.success).toBe(false);
  });
});
