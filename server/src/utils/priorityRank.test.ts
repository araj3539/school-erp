import { describe, it, expect } from "vitest";
import { PRIORITY_RANKS, priorityRank } from "./priorityRank.js";

describe("priorityRank", () => {
  it("returns descending importance low < normal < high < urgent", () => {
    expect(priorityRank("low")).toBeLessThan(priorityRank("normal"));
    expect(priorityRank("normal")).toBeLessThan(priorityRank("high"));
    expect(priorityRank("high")).toBeLessThan(priorityRank("urgent"));
  });

  it("falls back to normal for missing or unknown priorities", () => {
    expect(priorityRank(undefined)).toBe(PRIORITY_RANKS.normal);
    expect(priorityRank(null)).toBe(PRIORITY_RANKS.normal);
    expect(priorityRank("unknown")).toBe(PRIORITY_RANKS.normal);
  });
});
