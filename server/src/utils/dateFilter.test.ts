import { describe, it, expect } from "vitest";
import { rangeStartFor, rangeEndFilterFor } from "./dateFilter.js";

describe("dateFilter", () => {
  it("treats calendar-date inputs as inclusive local days", () => {
    const start = rangeStartFor("2026-10-30");
    expect(start).toEqual(new Date(2026, 9, 30));

    const end = rangeEndFilterFor("2026-10-30");
    expect(end).toEqual({ $lt: new Date(2026, 9, 31) });
  });

  it("passes full datetime inputs through unchanged", () => {
    const value = "2026-10-30T12:00:00.000Z";
    expect(rangeStartFor(value)).toEqual(new Date(value));
    expect(rangeEndFilterFor(value)).toEqual({ $lte: new Date(value) });
  });
});
