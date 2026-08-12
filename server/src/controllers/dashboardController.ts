import { Request, Response, NextFunction } from "express";
import { Student, IStudent, Teacher, ITeacher, Fee, IFee, Payment, IPayment, Attendance, IAttendance, Class, IClass, AcademicYear, IAcademicYear } from "../models";
import { AppError } from "../utils/errors";

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user!.schoolId;
    const currentYear = await AcademicYear.findOne({ isCurrent: true });
    if (!currentYear) {
      throw AppError.badRequest("No current academic year set");
    }

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      pendingFees,
      todayAttendance,
      recentAdmissions
    ] = await Promise.all([
      Student.countDocuments({ schoolId, status: "active" }),
      Teacher.countDocuments({ schoolId, status: "active" }),
      Class.countDocuments({ schoolId }),
      Fee.countDocuments({ schoolId, academicYear: currentYear._id, status: { $in: ["pending", "overdue", "partial"] } }),
      Attendance.findOne({
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }).lean(),
      Student.find({ schoolId })
        .sort({ admissionDate: -1 })
        .limit(5)
        .select("admissionNo firstName lastName classId admissionDate")
        .populate("classId")
        .lean()
    ]);

    const presentToday = todayAttendance
      ? todayAttendance.records.filter((r: any) => r.status === "present").length
      : 0;
    const totalStudentsToday = todayAttendance ? todayAttendance.records.length : 0;
    const attendanceRate = totalStudentsToday > 0 ? (presentToday / totalStudentsToday) * 100 : 0;

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const todayPayments = await Payment.find({ date: { $gte: startOfDay, $lte: endOfDay } }).lean();
    const todayCollection = todayPayments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        pendingFees,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        todayCollection
      },
      recentAdmissions
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardCharts(req: Request, res: Response, next: NextFunction) {
  try {
    const currentYear = await AcademicYear.findOne({ isCurrent: true });
    if (!currentYear) {
      throw AppError.badRequest("No current academic year set");
    }

    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      const attendance = await Attendance.findOne({ date: { $gte: date, $lt: nextDate } }).lean();
      const present = attendance ? attendance.records.filter((r: any) => r.status === "present").length : 0;
      const total = attendance ? attendance.records.length : 0;
      attendanceTrend.push({
        date: date.toISOString().split("T")[0],
        present,
        total,
        rate: total > 0 ? Math.round((present / total) * 100) : 0
      });
    }

    const collectionTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);
      const payments = await Payment.find({ date: { $gte: startOfDay, $lte: endOfDay } }).lean();
      const total = payments.reduce((sum, p) => sum + p.amount, 0);
      collectionTrend.push({ date: date.toISOString().split("T")[0], total });
    }

    const feeStatus = await Fee.aggregate([
      { $match: { academicYear: currentYear._id } },
      { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$balance" } } }
    ]);

    res.json({ attendanceTrend, collectionTrend, feeStatus });
  } catch (error) {
    next(error);
  }
}

export async function getBirthdays(req: Request, res: Response, next: NextFunction) {
  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const students = await Student.aggregate([
      { $match: { status: "active" } },
      { $addFields: { dobMonth: { $month: "$dob" }, dobDay: { $dayOfMonth: "$dob" } } },
      { $match: { dobMonth: month, dobDay: day } },
      { $project: { admissionNo: 1, firstName: 1, lastName: 1, dob: 1, classId: 1 } },
      { $limit: 10 }
    ]);
    res.json({ birthdays: students });
  } catch (error) {
    next(error);
  }
}
