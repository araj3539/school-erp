import { describe, expect, it } from "vitest";
import { addCalendarDays, parseCalendarDate } from "./calendarDate.js";

describe("calendar date utilities", () => {
  it("stores a valid calendar date at UTC midnight", () => {
    expect(parseCalendarDate("2026-08-22").toISOString()).toBe("2026-08-22T00:00:00.000Z");
  });

  it("rejects invalid calendar dates", () => {
    expect(() => parseCalendarDate("2026-02-30")).toThrow("Invalid calendar date");
    expect(() => parseCalendarDate("2026/08/22")).toThrow("YYYY-MM-DD");
  });

  it("adds days without local timezone drift", () => {
    const date = parseCalendarDate("2026-08-31");
    expect(addCalendarDays(date, 1).toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });
});
