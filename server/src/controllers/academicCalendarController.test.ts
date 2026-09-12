import { describe, expect, it } from "vitest";
import { CalendarEventSchema } from "../validators/academicCalendar.js";

describe("academic calendar invariants", () => {
  const base = { academicYearId: "507f1f77bcf86cd799439011", title: "Holiday", type: "holiday" as const, startDate: "2026-10-02", endDate: "2026-10-02", allDay: true, appliesTo: "school" as const };
  it("accepts a valid school-wide event", () => expect(CalendarEventSchema.safeParse(base).success).toBe(true));
  it("rejects reversed dates", () => expect(CalendarEventSchema.safeParse({ ...base, endDate: "2026-10-01" }).success).toBe(false));
  it("rejects an incomplete section target", () => expect(CalendarEventSchema.safeParse({ ...base, appliesTo: "section", classId: base.academicYearId }).success).toBe(false));
});
