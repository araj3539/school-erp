import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const schoolId = new Types.ObjectId();
const otherSchoolId = new Types.ObjectId();

const mocks = vi.hoisted(() => ({
  academicFindOne: vi.fn(),
  studentCount: vi.fn(),
  teacherCount: vi.fn(),
  classCount: vi.fn(),
  attendanceAggregate: vi.fn(),
  paymentAggregate: vi.fn(),
  feeAggregate: vi.fn(),
}));

vi.mock("../models/index.js", () => ({
  AcademicYear: { findOne: mocks.academicFindOne },
  Student: { countDocuments: mocks.studentCount },
  Teacher: { countDocuments: mocks.teacherCount },
  Class: { countDocuments: mocks.classCount },
  Attendance: { aggregate: mocks.attendanceAggregate },
  Payment: { aggregate: mocks.paymentAggregate },
  Fee: { aggregate: mocks.feeAggregate },
}));

import { getAnalyticsDataset, validateAnalyticsRange } from "./analyticsService.js";

describe("analyticsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.academicFindOne.mockReturnValue({ select: () => ({ lean: async () => ({ _id: new Types.ObjectId(), name: "2026-27" }) }) });
    mocks.studentCount.mockResolvedValueOnce(100).mockResolvedValueOnce(4);
    mocks.teacherCount.mockResolvedValue(8);
    mocks.classCount.mockResolvedValue(6);
    mocks.attendanceAggregate.mockResolvedValueOnce([{ _id: "2026-09-10", present: 90, total: 100 }]).mockResolvedValueOnce([{ count: 0 }]);
    mocks.paymentAggregate.mockResolvedValue([{ _id: "2026-09-10", total: 10000 }]);
    mocks.feeAggregate.mockResolvedValueOnce([{ _id: null, totalDue: 100000, paidAmount: 70000, balance: 30000 }]).mockResolvedValueOnce([{ _id: "pending", count: 10, outstanding: 30000 }]);
  });

  it("validates supported ranges", () => {
    expect(validateAnalyticsRange(undefined)).toBe(30);
    expect(validateAnalyticsRange("7")).toBe(7);
    expect(validateAnalyticsRange(90)).toBe(90);
    expect(() => validateAnalyticsRange("14")).toThrow("Analytics range must");
  });

  it("scopes every analytics query to the authenticated school", async () => {
    const result = await getAnalyticsDataset(schoolId, 7);
    expect(result.snapshot.activeStudents).toBe(100);
    expect(result.snapshot.collection).toBe(10000);

    const schoolQueries = [
      mocks.academicFindOne.mock.calls[0][0],
      ...mocks.studentCount.mock.calls.map(([query]) => query),
      ...mocks.teacherCount.mock.calls.map(([query]) => query),
      ...mocks.classCount.mock.calls.map(([query]) => query),
      ...mocks.attendanceAggregate.mock.calls.map(([pipeline]) => pipeline[0].$match),
      ...mocks.paymentAggregate.mock.calls.map(([pipeline]) => pipeline[0].$match),
      ...mocks.feeAggregate.mock.calls.map(([pipeline]) => pipeline[0].$match),
    ];
    expect(schoolQueries.every((query: any) => String(query.schoolId) === String(schoolId))).toBe(true);
    expect(schoolQueries.every((query: any) => String(query.schoolId) !== String(otherSchoolId))).toBe(true);
  });
});
