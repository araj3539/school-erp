import { Request, Response, NextFunction } from "express";
import { AcademicYear, Attendance, Exam, ExamResult, Fee, Homework, Notice, Student, Timetable } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";

function dayStart(date = new Date()) { const value = new Date(date); value.setHours(0, 0, 0, 0); return value; }
function dayEnd(date = new Date()) { const value = dayStart(date); value.setDate(value.getDate() + 1); return value; }

export async function getStudentWorkspace(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const student = await Student.findOne({ schoolId, userId: req.user!.userId, status: "active" })
      .select("_id admissionNo firstName lastName classId sectionId parentIds")
      .populate("classId sectionId")
      .lean();
    if (!student) throw AppError.forbidden("Student profile not found");

    const academicYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).select("_id name startDate endDate").lean();
    if (!academicYear) throw AppError.badRequest("No current academic year set");
    const todayDay = new Date().getDay() || 7;
    const sectionScope = student.sectionId
      ? { $or: [{ sectionId: student.sectionId }, { sectionId: { $exists: false } }] }
      : { sectionId: { $exists: false } };
    const noticeTargets = [
      { audience: "school" },
      { audience: "class", classId: student.classId },
      ...(student.sectionId ? [{ audience: "section", classId: student.classId, sectionId: student.sectionId }] : []),
    ];

    const [todayClasses, attendance, homework, exams, results, fees, notices] = await Promise.all([
      Timetable.find({ schoolId, academicYearId: academicYear._id, classId: student.classId, ...sectionScope, dayOfWeek: todayDay })
        .populate("subjectId teacherId sectionId").sort({ startTime: 1 }).limit(8).lean(),
      Attendance.find({ schoolId, classId: student.classId, ...(student.sectionId ? { sectionId: student.sectionId } : {}), "records.studentId": student._id })
        .select("date records").sort({ date: -1 }).limit(30).lean(),
      Homework.find({ schoolId, academicYearId: academicYear._id, classId: student.classId, ...sectionScope, dueDate: { $gte: dayStart(), $lt: dayEnd(new Date(Date.now() + 14 * 86400000)) } })
        .populate("subjectId sectionId").sort({ dueDate: 1 }).limit(8).lean(),
      Exam.find({ schoolId, academicYearId: academicYear._id, classId: student.classId, status: "published" })
        .select("name startDate endDate status").sort({ startDate: 1 }).limit(5).lean(),
      ExamResult.find({ schoolId, studentId: student._id, status: "published" })
        .populate("examId marks.subjectId").sort({ createdAt: -1 }).limit(5).lean(),
      Fee.find({ schoolId, studentId: student._id, academicYear: academicYear._id })
        .populate("feeStructureId").sort({ createdAt: -1 }).limit(20).lean(),
      Notice.find({ schoolId, publishAt: { $lte: new Date() }, $and: [
        { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] },
        { $or: noticeTargets },
      ] }).sort({ priority: -1, publishAt: -1 }).limit(8).lean(),
    ]);

    const present = attendance.reduce((sum: number, row: any) => sum + (row.records.some((record: any) => record.studentId.toString() === student._id.toString() && record.status === "present") ? 1 : 0), 0);
    const feeSummary = fees.reduce((summary: { totalDue: number; paid: number; balance: number; overdue: number }, fee: any) => {
      summary.totalDue += fee.totalDue || 0; summary.paid += fee.paidAmount || 0; summary.balance += fee.balance || 0;
      if (fee.status === "overdue") summary.overdue += fee.balance || 0;
      return summary;
    }, { totalDue: 0, paid: 0, balance: 0, overdue: 0 });

    res.json({
      role: req.user!.role,
      academicYear,
      student,
      summary: { attendanceTotal: attendance.length, attendancePresent: present, attendanceRate: attendance.length ? Math.round((present / attendance.length) * 100) : 0, feeBalance: feeSummary.balance },
      todayClasses,
      recentAttendance: attendance.slice(0, 7),
      upcomingHomework: homework,
      upcomingExams: exams,
      latestResults: results,
      fees: { summary: feeSummary, items: fees },
      notices,
    });
  } catch (error) { next(error); }
}
