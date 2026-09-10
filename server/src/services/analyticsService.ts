import { Types } from "mongoose";
import { AcademicYear, Attendance, Class, Fee, Payment, Student, Teacher } from "../models/index.js";

export type AnalyticsRange = 7 | 30 | 90;
export type TenantId = Types.ObjectId | string;

export interface AnalyticsDataset {
  rangeDays: AnalyticsRange;
  generatedAt: string;
  academicYear: { id: string; name: string };
  snapshot: {
    activeStudents: number;
    activeTeachers: number;
    classes: number;
    attendanceRate: number;
    collection: number;
    feeDue: number;
    feePaid: number;
    feeOutstanding: number;
  };
  trends: Array<{ date: string; attendanceRate: number; collection: number }>;
  feeStatus: Array<{ status: string; count: number; outstanding: number }>;
  dataQuality: {
    activeStudentsMissingClass: number;
    activeStudentsMissingSection: number;
    attendanceRecordsWithDuplicateStudents: number;
  };
}

function startOfUtcDay(daysAgo: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
}

function dateKey(date: Date): string { return date.toISOString().slice(0, 10); }
function roundPercent(value: number): number { return Math.round(value * 10) / 10; }

function emptyTrend(rangeDays: AnalyticsRange): Array<{ date: string; attendanceRate: number; collection: number }> {
  return Array.from({ length: rangeDays }, (_, index) => {
    const date = startOfUtcDay(rangeDays - index - 1);
    return { date: dateKey(date), attendanceRate: 0, collection: 0 };
  });
}

export async function getAnalyticsDataset(schoolId: TenantId, rangeDays: AnalyticsRange): Promise<AnalyticsDataset> {
  const currentYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).select("_id name").lean();
  if (!currentYear) throw new Error("No current academic year set");

  const start = startOfUtcDay(rangeDays - 1);
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() + 1);

  const [studentCounts, attendanceRows, paymentRows, feeSummary, feeStatus, missingClass, missingSection, duplicateAttendance] = await Promise.all([
    Promise.all([
      Student.countDocuments({ schoolId, status: "active" }),
      Teacher.countDocuments({ schoolId, status: "active" }),
      Class.countDocuments({ schoolId }),
    ]),
    Attendance.aggregate([
      { $match: { schoolId, date: { $gte: start, $lt: end } } },
      { $project: {
        date: 1,
        present: { $size: { $filter: { input: "$records", as: "record", cond: { $eq: ["$$record.status", "present"] } } } },
        total: { $size: "$records" },
      } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } },
        present: { $sum: "$present" },
        total: { $sum: "$total" },
      } },
      { $sort: { _id: 1 } },
    ]),
    Payment.aggregate([
      { $match: { schoolId, date: { $gte: start, $lt: end } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } },
        total: { $sum: "$amount" },
      } },
      { $sort: { _id: 1 } },
    ]),
    Fee.aggregate([
      { $match: { schoolId, academicYear: currentYear._id } },
      { $group: { _id: null, totalDue: { $sum: "$totalDue" }, paidAmount: { $sum: "$paidAmount" }, balance: { $sum: "$balance" } } },
    ]),
    Fee.aggregate([
      { $match: { schoolId, academicYear: currentYear._id } },
      { $group: { _id: "$status", count: { $sum: 1 }, outstanding: { $sum: "$balance" } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    Student.countDocuments({ schoolId, status: "active", $or: [{ classId: { $exists: false } }, { classId: null }] }),
    Student.countDocuments({ schoolId, status: "active", $or: [{ sectionId: { $exists: false } }, { sectionId: null }] }),
    Attendance.aggregate([
      { $match: { schoolId, date: { $gte: start, $lt: end } } },
      { $project: { ids: "$records.studentId" } },
      { $project: { duplicateCount: { $subtract: [{ $size: "$ids" }, { $size: { $setUnion: ["$ids", []] } }] } } },
      { $match: { duplicateCount: { $gt: 0 } } },
      { $count: "count" },
    ]),
  ]);

  const trend = emptyTrend(rangeDays);
  const trendMap = new Map(trend.map((row) => [row.date, row]));
  for (const row of attendanceRows) {
    const item = trendMap.get(String(row._id));
    if (item) item.attendanceRate = row.total > 0 ? roundPercent((row.present / row.total) * 100) : 0;
  }
  for (const row of paymentRows) {
    const item = trendMap.get(String(row._id));
    if (item) item.collection = Number(row.total ?? 0);
  }

  const totalAttendance = attendanceRows.reduce((sum: number, row: any) => sum + Number(row.total ?? 0), 0);
  const presentAttendance = attendanceRows.reduce((sum: number, row: any) => sum + Number(row.present ?? 0), 0);
  const fee = feeSummary[0] ?? { totalDue: 0, paidAmount: 0, balance: 0 };

  return {
    rangeDays,
    generatedAt: new Date().toISOString(),
    academicYear: { id: String(currentYear._id), name: String(currentYear.name) },
    snapshot: {
      activeStudents: studentCounts[0],
      activeTeachers: studentCounts[1],
      classes: studentCounts[2],
      attendanceRate: totalAttendance > 0 ? roundPercent((presentAttendance / totalAttendance) * 100) : 0,
      collection: paymentRows.reduce((sum: number, row: any) => sum + Number(row.total ?? 0), 0),
      feeDue: Number(fee.totalDue ?? 0),
      feePaid: Number(fee.paidAmount ?? 0),
      feeOutstanding: Number(fee.balance ?? 0),
    },
    trends: trend,
    feeStatus: feeStatus.map((row: any) => ({ status: String(row._id), count: Number(row.count), outstanding: Number(row.outstanding ?? 0) })),
    dataQuality: {
      activeStudentsMissingClass: missingClass,
      activeStudentsMissingSection: missingSection,
      attendanceRecordsWithDuplicateStudents: Number(duplicateAttendance[0]?.count ?? 0),
    },
  };
}

export function validateAnalyticsRange(value: unknown): AnalyticsRange {
  const parsed = Number(value ?? 30);
  if (parsed === 7 || parsed === 30 || parsed === 90) return parsed;
  throw new Error("Analytics range must be one of 7, 30 or 90 days");
}
