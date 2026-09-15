import { describe, expect, it } from "vitest";
import { scoreAtRiskStudents } from "./atRiskStudentService.js";

const id = (value: string) => ({ toString: () => value });
const student = (value: string) => ({ _id: id(value), firstName: value });

describe("at-risk student scoring", () => {
  it("combines explainable factors and assigns intervention at 50+", () => {
    const result = scoreAtRiskStudents({
      students: [student("a")],
      attendance: [{ records: [
        { studentId: id("a"), status: "present" },
        { studentId: id("a"), status: "absent" },
        { studentId: id("a"), status: "absent" },
        { studentId: id("a"), status: "absent" }
      ] }],
      results: [{ studentId: id("a"), percentage: 45, result: "fail" }],
      behaviour: [{ studentId: id("a"), severity: "high" }]
    });

    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(95);
    expect(result[0].level).toBe("intervention");
    expect(result[0].factors).toEqual([
      "Attendance 25% (below 75%)",
      "At least one published failed result",
      "Published result average 45%",
      "1 open high-severity behaviour incident"
    ]);
  });

  it("keeps a moderate signal at watch and filters scores below 25", () => {
    const result = scoreAtRiskStudents({
      students: [student("watch"), student("safe")],
      attendance: [{ records: [
        { studentId: id("watch"), status: "present" },
        { studentId: id("watch"), status: "absent" },
        { studentId: id("safe"), status: "present" }
      ] }],
      results: [],
      behaviour: [{ studentId: id("watch"), severity: "medium" }]
    });

    expect(result).toHaveLength(1);
    expect(result[0].student.firstName).toBe("watch");
    expect(result[0].score).toBe(25);
    expect(result[0].level).toBe("watch");
  });

  it("sorts highest score first and caps the score at 100", () => {
    const result = scoreAtRiskStudents({
      students: [student("low"), student("high")],
      attendance: [{ records: [
        { studentId: id("low"), status: "absent" },
        { studentId: id("low"), status: "absent" },
        { studentId: id("low"), status: "present" },
        { studentId: id("high"), status: "absent" },
        { studentId: id("high"), status: "absent" },
        { studentId: id("high"), status: "absent" },
        { studentId: id("high"), status: "absent" }
      ] }],
      results: [
        { studentId: id("low"), percentage: 60, result: "pass" },
        { studentId: id("high"), percentage: 20, result: "fail" },
        { studentId: id("high"), percentage: 30, result: "fail" }
      ],
      behaviour: [
        { studentId: id("high"), severity: "high" },
        { studentId: id("high"), severity: "high" }
      ]
    });

    expect(result.map((item) => item.student.firstName)).toEqual(["high", "low"]);
    expect(result[0].score).toBe(100);
  });
});
