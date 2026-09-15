import { Attendance, ExamResult, Homework, Student, StudentFamily, StudentLifecycleEvent, User } from "../models/index.js";
import { StudentBehaviour } from "../models/StudentBehaviour.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { Types } from "mongoose";
import { UserRole } from "@school-erp/shared";
import type { Request } from "express";

export async function getStudent360(req: Request, studentId: string) {
  const schoolId = getTenantId(req); if (!Types.ObjectId.isValid(studentId)) throw AppError.badRequest("Invalid student id");
  const access: any = { _id: studentId, schoolId };
  if (req.user!.role === UserRole.STUDENT) access.userId = req.user!.userId;
  else if (req.user!.role === UserRole.PARENT) access.parentIds = req.user!.userId;
  else if (req.user!.role === UserRole.TEACHER) {
    const candidate = await Student.findOne({ _id: studentId, schoolId }).select("classId").lean(); if (!candidate) throw AppError.notFound("Student not found");
    const Teacher = (await import("../models/Teacher.js")).Teacher; const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId }).select("classTeacherOf").lean();
    if (!teacher?.classTeacherOf?.some((id) => id.toString() === candidate.classId?.toString())) throw AppError.forbidden("You are not assigned to this student's class");
  }
  const student = await Student.findOne(access).lean(); if (!student) throw AppError.notFound("Student not found");
  const [parents, siblings, lifecycle, attendance, results, homework, behaviour] = await Promise.all([
    User.find({ _id: { $in: student.parentIds }, schoolId, role: UserRole.PARENT, isActive: true }).select("_id firstName lastName email phone").lean(),
    StudentFamily.find({ schoolId, studentIds: student._id }).lean(),
    StudentLifecycleEvent.find({ schoolId, studentId: student._id }).sort({ createdAt: -1 }).limit(20).lean(),
    Attendance.find({ schoolId, "records.studentId": student._id }).sort({ date: -1 }).limit(60).select("date classId sectionId lifecycle records").lean(),
    ExamResult.find({ schoolId, studentId: student._id, status: "published" }).sort({ createdAt: -1 }).limit(20).select("examId academicYearId marks totalMarks obtainedMarks percentage grade result status publishedAt").lean(),
    Homework.find({ schoolId, classId: student.classId, $or: [{ sectionId: student.sectionId }, { sectionId: { $exists: false } }] }).sort({ dueDate: -1 }).limit(20).select("title subjectId assignedDate dueDate classId sectionId academicYearId createdAt").lean(),
    StudentBehaviour.find({ schoolId, studentId: student._id }).sort({ occurredAt: -1, createdAt: -1 }).limit(20).select("kind category severity occurredAt description actionTaken status parentAcknowledgedAt resolvedAt createdAt").lean(),
  ]);
  const attendanceSummary = attendance.reduce((acc, day: any) => { const record = day.records.find((r: any) => r.studentId.toString() === student._id.toString()); if (!record) return acc; acc.total += 1; if (record.status === "present") acc.present += 1; else if (record.status === "absent") acc.absent += 1; else if (record.status === "late") acc.late += 1; return acc; }, { total: 0, present: 0, absent: 0, late: 0 });
  const attendancePercentage = attendanceSummary.total ? Number(((attendanceSummary.present / attendanceSummary.total) * 100).toFixed(1)) : null;
  const averagePercentage = results.length ? Number((results.reduce((s, r) => s + r.percentage, 0) / results.length).toFixed(1)) : null;
  const pendingHomework = homework.filter((h) => h.dueDate >= new Date().toISOString().slice(0, 10)).length;
  const siblingIds = siblings.flatMap((family: any) => family.studentIds.map((id: any) => id.toString())).filter((id: string) => id !== student._id.toString());
  const siblingStudents = siblingIds.length ? await Student.find({ _id: { $in: siblingIds }, schoolId }).select("_id admissionNo firstName lastName classId sectionId status").lean() : [];
  return { student: { _id: student._id, admissionNo: student.admissionNo, firstName: student.firstName, lastName: student.lastName, dob: student.dob, gender: student.gender, status: student.status, classId: student.classId, sectionId: student.sectionId, admissionDate: student.admissionDate, phone: student.phone, guardianPhone: student.guardianPhone }, parents, siblings: siblingStudents, attendance: { summary: { ...attendanceSummary, percentage: attendancePercentage }, recent: attendance.map((day: any) => { const r = day.records.find((x: any) => x.studentId.toString() === student._id.toString()); return { date: day.date, status: r?.status, remark: r?.remark, lifecycle: day.lifecycle }; }) }, academics: { results, averagePercentage, publishedResultCount: results.length }, homework: { items: homework, upcomingCount: pendingHomework }, behaviour, lifecycle };
}
