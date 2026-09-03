import { Request, Response, NextFunction } from "express";
import { AcademicYear, Student, Teacher, Timetable } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { UserRole } from "@school-erp/shared";

async function resolveScope(req: Request) {
  const schoolId = getTenantId(req);
  if (req.user!.role === UserRole.STUDENT) {
    const student = await Student.findOne({ schoolId, userId: req.user!.userId, status: "active" }).select("_id firstName lastName classId sectionId").populate("classId sectionId").lean();
    if (!student) throw AppError.notFound("Student record not found");
    return { students: [student], selectableStudents: [student], classIds: student.classId ? [student.classId._id || student.classId] : [] };
  }
  if (req.user!.role === UserRole.PARENT) {
    const childId = String(req.query.childId || "").trim();
    const filter: any = { schoolId, parentIds: req.user!.userId, status: "active" };
    const selectableStudents = await Student.find(filter).select("_id firstName lastName admissionNo classId sectionId").populate("classId sectionId").sort({ firstName: 1, lastName: 1 }).lean();
    if (!selectableStudents.length) throw AppError.notFound("No linked children found");
    const students = childId ? selectableStudents.filter((student: any) => student._id.toString() === childId) : selectableStudents;
    if (!students.length) throw AppError.notFound("Child not found");
    return { students, selectableStudents, classIds: students.filter((s: any) => s.classId).map((s: any) => s.classId._id || s.classId) };
  }
  if (req.user!.role === UserRole.TEACHER) {
    const teacher = await Teacher.findOne({ schoolId, userId: req.user!.userId, status: "active" }).select("_id firstName lastName").lean();
    if (!teacher) throw AppError.notFound("Teacher record not found");
    return { students: [], selectableStudents: [], teacherId: teacher._id, classIds: [] };
  }
  throw AppError.forbidden("Portal timetable is not available for this role");
}

export async function getPortalTimetable(req: Request, res: Response, next: NextFunction) {
  try {
    const scope: any = await resolveScope(req);
    const schoolId = getTenantId(req);
    const academicYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).select("_id name startDate endDate").lean();
    if (!academicYear) throw AppError.badRequest("No current academic year set");
    const filter: any = { schoolId, academicYearId: academicYear._id };
    const day = Number(req.query.dayOfWeek || 0);
    if (day >= 1 && day <= 7) filter.dayOfWeek = day;
    if (scope.teacherId) filter.teacherId = scope.teacherId;
    else if (scope.students.length === 1) {
      const student: any = scope.students[0];
      if (!student.classId) return res.json({ academicYear, students: scope.selectableStudents.map(formatStudent), entries: [] });
      filter.classId = student.classId._id || student.classId;
      filter.$or = student.sectionId ? [{ sectionId: student.sectionId._id || student.sectionId }, { sectionId: { $exists: false } }] : [{ sectionId: { $exists: false } }];
    } else {
      if (!scope.classIds.length) return res.json({ academicYear, students: scope.selectableStudents.map(formatStudent), entries: [] });
      filter.$or = scope.classIds.flatMap((classId: any) => [{ classId, sectionId: { $exists: false } }, { classId, sectionId: { $in: scope.students.filter((s: any) => s.classId && s.sectionId && (s.classId._id || s.classId).toString() === classId.toString()).map((s: any) => s.sectionId._id || s.sectionId) } }]);
    }
    const entries = await Timetable.find(filter).populate("classId sectionId subjectId teacherId").sort({ dayOfWeek: 1, startTime: 1 }).limit(100).lean();
    res.json({ academicYear, students: scope.selectableStudents.map(formatStudent), selectedStudentId: scope.students.length === 1 ? scope.students[0]._id : null, entries: entries.map((item: any) => ({ _id: item._id, dayOfWeek: item.dayOfWeek, startTime: item.startTime, endTime: item.endTime, periodLabel: item.periodLabel || "", roomNumber: item.roomNumber || "", subject: item.subjectId?.name || "Subject", teacher: item.teacherId ? `${item.teacherId.firstName || ""} ${item.teacherId.lastName || ""}`.trim() : "", class: item.classId?.displayName || "Class", section: item.sectionId?.name || "" })) });
  } catch (error) { next(error); }
}

function formatStudent(student: any) {
  return { _id: student._id, firstName: student.firstName, lastName: student.lastName, class: student.classId?.displayName || "", section: student.sectionId?.name || "" };
}
