import { describe, expect, it } from "vitest";
import { buildParentActions } from "./ParentWorkspacePage";

describe("Parent Action Center", () => {
  it("surfaces overdue fees, upcoming work, exams and important notices", () => {
    const actions = buildParentActions({
      selectedChild: { firstName: "Anaya" },
      summary: { fee: { overdue: 1200 } },
      upcomingHomework: [{ _id: "h1", title: "Math worksheet", dueDate: "2026-09-20T00:00:00.000Z" }],
      upcomingExams: [{ _id: "e1", name: "Unit Test", startDate: "2026-09-22T00:00:00.000Z" }],
      notices: [{ _id: "n1", title: "PTM schedule", priority: "high" }]
    });

    expect(actions.map((item) => item.id)).toEqual(["fee-overdue", "homework-h1", "exam-e1", "notice-n1"]);
    expect(actions[0].detail).toContain("₹1200");
    expect(actions[1].title).toContain("Math worksheet");
    expect(actions[3].to).toBe("/portal-notices");
  });

  it("does not invent actions when the existing parent workspace has no actionable items", () => {
    expect(buildParentActions({ selectedChild: { firstName: "Anaya" }, summary: { fee: { overdue: 0 } }, upcomingHomework: [], upcomingExams: [], notices: [] })).toEqual([]);
  });
});
