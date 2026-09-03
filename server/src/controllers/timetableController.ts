import { Request, Response, NextFunction } from "express";
import { AcademicYear, Class, Section, Student, Subject, Teacher, Timetable } from "../models/index.js";
import { UserRole } from "@school-erp/shared";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { createAuditLog } from "../services/auditLog.js";
function tenantFilter(req: Request, extra: Record<string, unknown> = {}) { return { schoolId: getTenantId(req), ...extra } as Record<string, any>; }
async function validateTarget(req: Request, data: any) {
  const schoolId = getTenantId(req);
  const [year, klass, subject, teacher] = await Promise.all([AcademicYear.findOne({ _id: data.academicYearId, schoolId }).select("_id").lean(), Class.findOne({ _id: data.classId, schoolId }).select("_id").lean(), Subject.findOne({ _id: data.subjectId, schoolId, classIds: data.classId }).select("_id").lean(), Teacher.findOne({ _id: data.teacherId, schoolId, status: "active" }).select("_id").lean()]);
  if (!year) throw AppError.badRequest("Academic year must belong to this school"); if (!klass) throw AppError.badRequest("Class must belong to this school"); if (!subject) throw AppError.badRequest("Subject must belong to this school and class"); if (!teacher) throw AppError.badRequest("Teacher must be an active teacher in this school");
  if (data.sectionId && !(await Section.exists({ _id: data.sectionId, classId: data.classId, schoolId }))) throw AppError.badRequest("Section must belong to the selected class and school");
  if (data.startTime >= data.endTime) throw AppError.badRequest("End time must be after start time");
}
function overlap(a: any, b: any) { return a.startTime < b.endTime && b.startTime < a.endTime; }
async function assertNoConflict(req: Request, data: any, excludeId?: string) {
  const filter: any = tenantFilter(req, { academicYearId: data.academicYearId, dayOfWeek: data.dayOfWeek }); if (excludeId) filter._id = { $ne: excludeId };
  const entries: any[] = await Timetable.find(filter).select("classId sectionId teacherId roomNumber startTime endTime").lean();
  for (const entry of entries) {
    if (!overlap(data, entry)) continue;
    const sameClass = entry.classId.toString() === data.classId.toString(); const sameSection = !entry.sectionId || !data.sectionId || entry.sectionId.toString() === data.sectionId.toString();
    if (sameClass && sameSection) throw AppError.conflict("Class has another timetable entry during this time", "TIMETABLE_CLASS_CONFLICT");
    if (entry.teacherId.toString() === data.teacherId.toString()) throw AppError.conflict("Teacher is already scheduled during this time", "TIMETABLE_TEACHER_CONFLICT");
    if (data.roomNumber && entry.roomNumber && entry.roomNumber.toLowerCase() === data.roomNumber.toLowerCase()) throw AppError.conflict("Room is already booked during this time", "TIMETABLE_ROOM_CONFLICT");
  }
}
function emptyResult(q: any, res: Response) { return res.json({ data: [], pagination: { page: q.page, limit: q.limit, total: 0, totalPages: 0 } }); }
export async function getTimetable(req: Request, res: Response, next: NextFunction) { try {
  const q: any = req.validatedQuery || {}; const filter: any = tenantFilter(req); if (q.academicYearId) filter.academicYearId = q.academicYearId; if (q.dayOfWeek) filter.dayOfWeek = q.dayOfWeek;
  if (req.user!.role === UserRole.TEACHER) { const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: getTenantId(req) }).select("_id").lean(); if (!teacher) return emptyResult(q, res); filter.teacherId = teacher._id; }
  else if (req.user!.role === UserRole.STUDENT) { const student = await Student.findOne({ userId: req.user!.userId, schoolId: getTenantId(req), status: "active" }).select("classId sectionId").lean(); if (!student?.classId) return emptyResult(q, res); filter.classId = student.classId; filter.$or = student.sectionId ? [{ sectionId: student.sectionId }, { sectionId: { $exists: false } }] : [{ sectionId: { $exists: false } }]; }
  else if (req.user!.role === UserRole.PARENT) { const children = await Student.find({ parentIds: req.user!.userId, schoolId: getTenantId(req), status: "active" }).select("classId sectionId").lean(); if (!children.length) return emptyResult(q, res); filter.$or = children.flatMap((child: any) => child.sectionId ? [{ classId: child.classId, sectionId: child.sectionId }, { classId: child.classId, sectionId: { $exists: false } }] : [{ classId: child.classId, sectionId: { $exists: false } }]); }
  else { if (q.classId) filter.classId = q.classId; if (q.sectionId) filter.sectionId = q.sectionId; if (q.teacherId) filter.teacherId = q.teacherId; }
  const skip = (q.page - 1) * q.limit; const [data, total] = await Promise.all([Timetable.find(filter).populate("classId sectionId subjectId teacherId academicYearId").sort({ dayOfWeek: 1, startTime: 1 }).skip(skip).limit(q.limit).lean(), Timetable.countDocuments(filter)]);
  res.json({ data, pagination: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) } });
} catch (e) { next(e); } }
export async function createTimetable(req: Request, res: Response, next: NextFunction) { try { const data: any = req.validatedBody; await validateTarget(req, data); await assertNoConflict(req, data); const entry = await Timetable.create({ ...data, schoolId: getTenantId(req), createdBy: req.user!.userId }); await createAuditLog({ userId: req.user!.userId, action: "CREATE", entity: "Timetable", entityId: entry._id.toString(), after: data }); res.status(201).json({ timetable: entry }); } catch (e) { next(e); } }
export async function updateTimetable(req: Request, res: Response, next: NextFunction) { try { const { id } = req.validatedParams as { id: string }; const existing: any = await Timetable.findOne(tenantFilter(req, { _id: id })); if (!existing) throw AppError.notFound("Timetable entry not found"); const data: any = req.validatedBody; const merged = { ...existing.toObject(), ...data }; await validateTarget(req, merged); await assertNoConflict(req, merged, id); const before = existing.toObject(); Object.assign(existing, data, { updatedBy: req.user!.userId }); await existing.save(); await createAuditLog({ userId: req.user!.userId, action: "UPDATE", entity: "Timetable", entityId: id, before, after: existing.toObject() }); res.json({ timetable: existing }); } catch (e) { next(e); } }
export async function deleteTimetable(req: Request, res: Response, next: NextFunction) { try { const { id } = req.validatedParams as { id: string }; const entry: any = await Timetable.findOneAndDelete(tenantFilter(req, { _id: id })); if (!entry) throw AppError.notFound("Timetable entry not found"); await createAuditLog({ userId: req.user!.userId, action: "DELETE", entity: "Timetable", entityId: id, before: entry.toObject() }); res.status(204).send(); } catch (e) { next(e); } }
