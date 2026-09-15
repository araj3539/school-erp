import { Types } from "mongoose";
import { AcademicYear, Teacher, TeacherAbsence, Timetable } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { createAuditLog } from "./auditLog.js";
import { enqueueNotificationEvent } from "./notificationService.js";

export async function listAbsences(schoolId: string, query: any) {
  const filter: any = { schoolId };
  if (query.date) filter.date = query.date;
  if (query.teacherId) filter.teacherId = query.teacherId;
  if (query.status) filter.status = query.status;
  if (query.startDate || query.endDate) filter.date = { ...(query.startDate ? { $gte: query.startDate } : {}), ...(query.endDate ? { $lte: query.endDate } : {}) };
  return TeacherAbsence.find(filter).populate("teacherId", "firstName lastName employeeId").populate("assignments.substituteTeacherId", "firstName lastName employeeId").sort({ date: -1, createdAt: -1 }).lean();
}

export async function createAbsence(schoolId: string, data: any, actorId: string) {
  const teacher = await Teacher.findOne({ _id: data.teacherId, schoolId, status: "active" }).select("_id firstName lastName").lean();
  if (!teacher) throw AppError.badRequest("Teacher must be an active teacher in this school");
  const existing = await TeacherAbsence.findOne({ schoolId, teacherId: data.teacherId, date: data.date }).lean();
  if (existing) return existing;
  const year = await AcademicYear.findOne({ schoolId, isCurrent: true }).select("_id").lean();
  if (!year) throw AppError.badRequest("No current academic year configured");
  const day = new Date(`${data.date}T00:00:00Z`).getUTCDay() || 7;
  const periods = await Timetable.find({ schoolId, academicYearId: year._id, teacherId: data.teacherId, dayOfWeek: day }).select("_id classId sectionId subjectId teacherId startTime endTime periodLabel roomNumber academicYearId dayOfWeek").lean();
  const absence = await TeacherAbsence.create({ schoolId, teacherId: data.teacherId, date: data.date, reason: data.reason, affectedTimetableIds: periods.map((p) => p._id), createdBy: actorId });
  await createAuditLog({ userId: actorId, schoolId, action: "TEACHER_ABSENCE_REPORTED", entity: "TeacherAbsence", entityId: absence._id.toString(), after: { date: data.date, teacherId: data.teacherId, affectedPeriods: periods.length } });
  return { absence, affectedPeriods: periods };
}

export async function getAbsenceDetails(schoolId: string, id: string) {
  const absence: any = await TeacherAbsence.findOne({ _id: id, schoolId }).populate("teacherId", "firstName lastName employeeId").populate("assignments.substituteTeacherId", "firstName lastName employeeId").lean();
  if (!absence) throw AppError.notFound("Teacher absence not found");
  const periods: any[] = await Timetable.find({ _id: { $in: absence.affectedTimetableIds }, schoolId }).populate("classId sectionId subjectId", "name").sort({ startTime: 1 }).lean();
  return { absence, periods };
}

export async function eligibleSubstitutes(schoolId: string, absenceId: string, timetableId: string) {
  const absence: any = await TeacherAbsence.findOne({ _id: absenceId, schoolId }).lean();
  if (!absence || absence.status === "cancelled") throw AppError.notFound("Teacher absence not found");
  const period: any = await Timetable.findOne({ _id: timetableId, schoolId, _id: { $in: absence.affectedTimetableIds } }).lean();
  if (!period) throw AppError.badRequest("Timetable period is not part of this absence");
  const teachers: any[] = await Teacher.find({ schoolId, status: "active", _id: { $ne: absence.teacherId } }).select("_id firstName lastName employeeId subjects classTeacherOf").sort({ firstName: 1, lastName: 1 }).lean();
  const busy = await Timetable.find({ schoolId, academicYearId: period.academicYearId, dayOfWeek: period.dayOfWeek, startTime: { $lt: period.endTime }, endTime: { $gt: period.startTime } }).select("teacherId").lean();
  const busyIds = new Set(busy.map((x) => x.teacherId.toString()));
  const assignedIds = new Set((absence.assignments || []).filter((x: any) => x.timetableId.toString() !== timetableId).map((x: any) => x.substituteTeacherId.toString()));
  return teachers.filter((t) => !busyIds.has(t._id.toString()) && !assignedIds.has(t._id.toString()));
}

export async function assignSubstitute(schoolId: string, absenceId: string, timetableId: string, substituteTeacherId: string, actorId: string) {
  const absence: any = await TeacherAbsence.findOne({ _id: absenceId, schoolId });
  if (!absence || absence.status === "cancelled") throw AppError.notFound("Teacher absence not found");
  const period: any = await Timetable.findOne({ schoolId, _id: { $eq: timetableId, $in: absence.affectedTimetableIds } }).lean();
  if (!period) throw AppError.badRequest("Timetable period is not part of this absence");
  const substitute = await Teacher.findOne({ _id: substituteTeacherId, schoolId, status: "active" }).select("_id firstName lastName userId").lean();
  if (!substitute) throw AppError.badRequest("Substitute teacher must be active and belong to this school");
  if (substituteTeacherId === absence.teacherId.toString()) throw AppError.conflict("Absent teacher cannot substitute their own period");
  const busy = await Timetable.findOne({ schoolId, academicYearId: period.academicYearId, dayOfWeek: period.dayOfWeek, teacherId: substituteTeacherId, startTime: { $lt: period.endTime }, endTime: { $gt: period.startTime } }).select("_id").lean();
  if (busy) throw AppError.conflict("Substitute teacher has a timetable conflict", "SUBSTITUTE_TEACHER_CONFLICT");
  const already = absence.assignments.find((x: any) => x.timetableId.toString() === timetableId);
  if (already) { if (already.substituteTeacherId.toString() === substituteTeacherId) return absence.toObject(); throw AppError.conflict("This period already has a substitute"); }
  if (absence.assignments.some((x: any) => x.substituteTeacherId.toString() === substituteTeacherId)) throw AppError.conflict("Substitute teacher is already assigned to another affected period");
  absence.assignments.push({ timetableId: new Types.ObjectId(timetableId), substituteTeacherId: new Types.ObjectId(substituteTeacherId), assignedBy: new Types.ObjectId(actorId), assignedAt: new Date() } as any);
  absence.status = absence.assignments.length === absence.affectedTimetableIds.length ? "assigned" : "partially_assigned";
  await absence.save();
  if (substitute.userId) await enqueueNotificationEvent({ schoolId: new Types.ObjectId(schoolId), eventType: "teacher.substitute_assigned", category: "attendance", priority: "high", recipientIds: [substitute.userId], title: "Substitute period assigned", message: `You have been assigned a substitute period on ${absence.date}.`, idempotencyKey: `substitute:${absence._id}:${timetableId}`, payload: { absenceId, timetableId } });
  await createAuditLog({ userId: actorId, schoolId, action: "ASSIGN_TEACHER_SUBSTITUTE", entity: "TeacherAbsence", entityId: absenceId, after: { timetableId, substituteTeacherId, status: absence.status } });
  return absence.toObject();
}
