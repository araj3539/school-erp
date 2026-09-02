import { Request, Response, NextFunction } from "express";
import { Student, Teacher, Fee, Payment, Attendance, Class, AcademicYear } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";

function utcDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDayStart(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const currentYear = await AcademicYear.findOne({ schoolId, isCurrent: true });
    if (!currentYear) throw AppError.badRequest("No current academic year set");

    const [totalStudents, totalTeachers, totalClasses, pendingFees, todayAttendance, recentAdmissions] = await Promise.all([
      Student.countDocuments({ schoolId, status: "active" }),
      Teacher.countDocuments({ schoolId, status: "active" }),
      Class.countDocuments({ schoolId }),
      Fee.countDocuments({ schoolId, academicYear: currentYear._id, status: { $in: ["pending", "overdue", "partial"] } }),
      Attendance.findOne({ schoolId, date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)), $lt: new Date(new Date().setHours(23, 59, 59, 999)) } }).lean(),
      Student.find({ schoolId }).sort({ admissionDate: -1 }).limit(5).select("admissionNo firstName lastName classId admissionDate").populate("classId").lean()
    ]);

    const presentToday = todayAttendance ? todayAttendance.records.filter((r: any) => r.status === "present").length : 0;
    const totalStudentsToday = todayAttendance ? todayAttendance.records.length : 0;
    const attendanceRate = totalStudentsToday > 0 ? (presentToday / totalStudentsToday) * 100 : 0;
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const todayPayments = await Payment.find({ schoolId, date: { $gte: startOfDay, $lte: endOfDay } }).lean();
    const todayCollection = todayPayments.reduce((sum, p) => sum + p.amount, 0);

    res.json({ stats: { totalStudents, totalTeachers, totalClasses, pendingFees, attendanceRate: Math.round(attendanceRate * 10) / 10, todayCollection }, recentAdmissions });
  } catch (error) { next(error); }
}

export async function getDashboardCharts(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const currentYear = await AcademicYear.findOne({ schoolId, isCurrent: true });
    if (!currentYear) throw AppError.badRequest("No current academic year set");

    const attendanceStart = new Date();
    attendanceStart.setUTCHours(0, 0, 0, 0);
    attendanceStart.setUTCDate(attendanceStart.getUTCDate() - 6);
    const attendanceEnd = new Date();
    attendanceEnd.setUTCHours(0, 0, 0, 0);
    attendanceEnd.setUTCDate(attendanceEnd.getUTCDate() + 1);

    const paymentStart = localDayStart(new Date());
    paymentStart.setDate(paymentStart.getDate() - 29);
    const paymentEnd = localDayStart(new Date());
    paymentEnd.setDate(paymentEnd.getDate() + 1);

    const [attendanceRows, payments] = await Promise.all([
      Attendance.aggregate([
        { $match: { schoolId, date: { $gte: attendanceStart, $lt: attendanceEnd } } },
        { $unwind: "$records" },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } },
          present: { $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] } },
          total: { $sum: 1 },
        } },
        { $sort: { _id: 1 } },
      ]),
      Payment.find({ schoolId, date: { $gte: paymentStart, $lt: paymentEnd } }).select("date amount").lean(),
    ]);

    const attendanceByDate = new Map(attendanceRows.map((row: any) => [row._id, row]));
    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - i);
      const key = utcDateKey(date);
      const row = attendanceByDate.get(key);
      const present = row?.present ?? 0;
      const total = row?.total ?? 0;
      attendanceTrend.push({ date: key, present, total, rate: total > 0 ? Math.round((present / total) * 100) : 0 });
    }

    const collectionByDate = new Map<string, number>();
    for (const payment of payments) {
      const key = localDateKey(new Date(payment.date));
      collectionByDate.set(key, (collectionByDate.get(key) ?? 0) + payment.amount);
    }
    const collectionTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      collectionTrend.push({ date: localDateKey(date), total: collectionByDate.get(localDateKey(date)) ?? 0 });
    }

    const feeStatus = await Fee.aggregate([
      { $match: { schoolId, academicYear: currentYear._id } },
      { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$balance" } } },
    ]);
    res.json({ attendanceTrend, collectionTrend, feeStatus });
  } catch (error) { next(error); }
}

export async function getBirthdays(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const today = new Date();
    const students = await Student.aggregate([
      { $match: { schoolId, status: "active" } },
      { $addFields: { dobMonth: { $month: "$dob" }, dobDay: { $dayOfMonth: "$dob" } } },
      { $match: { dobMonth: today.getMonth() + 1, dobDay: today.getDate() } },
      { $project: { admissionNo: 1, firstName: 1, lastName: 1, dob: 1, classId: 1 } },
      { $limit: 10 }
    ]);
    res.json({ birthdays: students });
  } catch (error) { next(error); }
}
