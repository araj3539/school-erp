import { Request, Response, NextFunction } from "express";
import { AcademicYear, Attendance, Exam, Homework, Notice, Student, Teacher, Timetable } from "../models/index.js";
import { UserRole } from "@school-erp/shared";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";

function dayStart(date = new Date()) { const value = new Date(date); value.setHours(0, 0, 0, 0); return value; }
function dayEnd(date = new Date()) { const value = dayStart(date); value.setDate(value.getDate() + 1); return value; }
function noticeFilter(targets: Record<string, unknown>[]) { return { publishAt: { $lte: new Date() }, $and: [{ $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] }, { $or: targets }] }; }
async function getCurrentAcademicYear(schoolId: string) { return AcademicYear.findOne({ schoolId, isCurrent: true }).select("_id name startDate endDate").lean(); }
async function getTeacherContext(req: Request) { const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: getTenantId(req), status: "active" }).select("_id firstName lastName subjects classTeacherOf").lean(); if (!teacher) throw AppError.forbidden("Teacher profile not found"); return teacher; }
async function getStudentContext(req: Request) { const student = await Student.findOne({ userId: req.user!.userId, schoolId: getTenantId(req), status: "active" }).select("_id admissionNo firstName lastName classId sectionId").populate("classId sectionId").lean(); if (!student) throw AppError.forbidden("Student profile not found"); return student; }
async function getParentChildren(req: Request) { return Student.find({ parentIds: req.user!.userId, schoolId: getTenantId(req), status: "active" }).select("_id admissionNo firstName lastName classId sectionId").populate("classId sectionId").sort({ firstName: 1, lastName: 1 }).lean(); }

export async function getPortalDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req); const role = req.user!.role; const academicYear = await getCurrentAcademicYear(schoolId);
    if (!academicYear) throw AppError.badRequest("No current academic year set");
    const todayDay = new Date().getDay() || 7;

    if (role === UserRole.TEACHER) {
      const teacher = await getTeacherContext(req); const classIds = teacher.classTeacherOf ?? []; const subjectIds = teacher.subjects ?? [];
      const homeworkScope = classIds.length || subjectIds.length ? { $or: [...(classIds.length ? [{ classId: { $in: classIds } }] : []), ...(subjectIds.length ? [{ subjectId: { $in: subjectIds } }] : [])] } : { _id: null };
      const targets = [{ audience: "school" }, ...(classIds.length ? [{ audience: "class", classId: { $in: classIds } }, { audience: "section", classId: { $in: classIds } }] : [])];
      const [todayClasses, todayAttendance, homeworkAttention, notices] = await Promise.all([
        Timetable.find({ schoolId, academicYearId: academicYear._id, teacherId: teacher._id, dayOfWeek: todayDay }).populate("classId sectionId subjectId").sort({ startTime: 1 }).limit(8).lean(),
        classIds.length ? Attendance.find({ schoolId, date: { $gte: dayStart(), $lt: dayEnd() }, classId: { $in: classIds } }).select("classId sectionId records").populate("classId sectionId").sort({ classId: 1 }).limit(20).lean() : [],
        Homework.find({ schoolId, academicYearId: academicYear._id, ...homeworkScope, dueDate: { $gte: dayStart(), $lt: dayEnd(new Date(Date.now() + 8 * 86400000)) } }).populate("classId sectionId subjectId").sort({ dueDate: 1 }).limit(8).lean(),
        Notice.find({ schoolId, ...noticeFilter(targets) }).sort({ priority: -1, publishAt: -1 }).limit(5).lean(),
      ]);
      return res.json({ role, academicYear, teacher: { _id: teacher._id, firstName: teacher.firstName, lastName: teacher.lastName }, summary: { assignedClasses: classIds.length, assignedSubjects: subjectIds.length, classesToday: todayClasses.length }, todayClasses, todayAttendance, homeworkAttention, notices });
    }

    if (role === UserRole.STUDENT) {
      const student = await getStudentContext(req); const sectionScope = student.sectionId ? { $or: [{ sectionId: student.sectionId }, { sectionId: { $exists: false } }] } : { sectionId: { $exists: false } };
      const targets = [{ audience: "school" }, { audience: "class", classId: student.classId }, ...(student.sectionId ? [{ audience: "section", classId: student.classId, sectionId: student.sectionId }] : [])];
      const [todayClasses, attendance, homework, exams, notices] = await Promise.all([
        Timetable.find({ schoolId, academicYearId: academicYear._id, classId: student.classId, ...sectionScope, dayOfWeek: todayDay }).populate("classId sectionId subjectId teacherId").sort({ startTime: 1 }).limit(8).lean(),
        Attendance.find({ schoolId, classId: student.classId, ...(student.sectionId ? { sectionId: student.sectionId } : {}), "records.studentId": student._id }).select("date records").sort({ date: -1 }).limit(30).lean(),
        Homework.find({ schoolId, academicYearId: academicYear._id, classId: student.classId, ...sectionScope, dueDate: { $gte: dayStart(), $lt: dayEnd(new Date(Date.now() + 14 * 86400000)) } }).populate("subjectId classId sectionId").sort({ dueDate: 1 }).limit(8).lean(),
        Exam.find({ schoolId, academicYearId: academicYear._id, classId: student.classId, status: "published" }).select("name startDate endDate status").sort({ startDate: 1 }).limit(5).lean(),
        Notice.find({ schoolId, ...noticeFilter(targets) }).sort({ priority: -1, publishAt: -1 }).limit(5).lean(),
      ]);
      const attendanceSummary = { total: attendance.length, present: attendance.reduce((sum: number, item: any) => sum + (item.records.some((record: any) => record.studentId.toString() === student._id.toString() && record.status === "present") ? 1 : 0), 0) };
      return res.json({ role, academicYear, student, summary: { attendanceTotal: attendanceSummary.total, attendancePresent: attendanceSummary.present, attendanceRate: attendanceSummary.total ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100) : 0 }, todayClasses, upcomingHomework: homework, upcomingExams: exams, notices });
    }

    if (role === UserRole.PARENT) {
      const children = await getParentChildren(req); const childIds = children.map((child) => child._id); const classIds = children.map((child) => child.classId).filter(Boolean);
      const targets = [{ audience: "school" }, ...(classIds.length ? [{ audience: "class", classId: { $in: classIds } }, { audience: "section", classId: { $in: classIds } }] : [])];
      const [attendance, homework, exams, notices] = await Promise.all([
        childIds.length ? Attendance.find({ schoolId, "records.studentId": { $in: childIds }, date: { $gte: new Date(Date.now() - 30 * 86400000), $lt: dayEnd() } }).select("date classId sectionId records").sort({ date: -1 }).limit(100).lean() : [],
        classIds.length ? Homework.find({ schoolId, academicYearId: academicYear._id, classId: { $in: classIds }, dueDate: { $gte: dayStart(), $lt: dayEnd(new Date(Date.now() + 14 * 86400000)) } }).populate("classId sectionId subjectId").sort({ dueDate: 1 }).limit(12).lean() : [],
        classIds.length ? Exam.find({ schoolId, academicYearId: academicYear._id, classId: { $in: classIds }, status: "published" }).select("name classId startDate endDate status").sort({ startDate: 1 }).limit(10).lean() : [],
        Notice.find({ schoolId, ...noticeFilter(targets) }).sort({ priority: -1, publishAt: -1 }).limit(8).lean(),
      ]);
      const attendanceByChild = children.map((child) => { const rows = attendance.filter((item: any) => item.records.some((record: any) => record.studentId.toString() === child._id.toString())); const present = rows.reduce((sum: number, item: any) => sum + (item.records.some((record: any) => record.studentId.toString() === child._id.toString() && record.status === "present") ? 1 : 0), 0); return { studentId: child._id, total: rows.length, present, rate: rows.length ? Math.round((present / rows.length) * 100) : 0 }; });
      return res.json({ role, academicYear, children, attendance: attendanceByChild, upcomingHomework: homework, upcomingExams: exams, notices });
    }
    return res.status(403).json({ error: "Portal dashboard is not available for this role" });
  } catch (error) { next(error); }
}
