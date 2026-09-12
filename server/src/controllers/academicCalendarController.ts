import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AcademicCalendarEvent, AcademicYear, Class, Section } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { createAuditLog } from "../services/auditLog.js";

function tenant(req: Request): Types.ObjectId { const id = req.user?.schoolId; if (!id) throw AppError.forbidden("A school context is required"); return new Types.ObjectId(id); }
function actor(req: Request): string { const id = req.user?.userId; if (!id) throw AppError.unauthorized("Authenticated user required"); return id; }
const snapshot = (event: any) => event.toObject() as Record<string, unknown>;

async function assertTargetOwnership(schoolId: Types.ObjectId, appliesTo: string, classId?: string, sectionId?: string) {
  if (appliesTo === "school" && (classId || sectionId)) throw AppError.badRequest("School-wide events cannot specify class or section");
  if (appliesTo === "class") {
    if (!classId) throw AppError.badRequest("Class events require a class");
    if (!await Class.exists({ _id: classId, schoolId })) throw AppError.badRequest("Class does not belong to this school");
  }
  if (appliesTo === "section") {
    if (!classId || !sectionId) throw AppError.badRequest("Section events require class and section");
    if (!await Class.exists({ _id: classId, schoolId })) throw AppError.badRequest("Class does not belong to this school");
    if (!await Section.exists({ _id: sectionId, classId })) throw AppError.badRequest("Section does not belong to the selected class");
  }
}

export async function listCalendarEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = tenant(req);
    const filter: Record<string, unknown> = { schoolId, isActive: true };
    if (req.query.academicYearId) filter.academicYearId = req.query.academicYearId;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.startDate || req.query.endDate) {
      const from = req.query.startDate ? new Date(String(req.query.startDate)) : new Date("1970-01-01");
      const to = req.query.endDate ? new Date(String(req.query.endDate)) : new Date("2999-12-31");
      filter.startDate = { $lte: to };
      filter.endDate = { $gte: from };
    }
    res.json(await AcademicCalendarEvent.find(filter).sort({ startDate: 1, _id: 1 }).lean());
  } catch (e) { next(e); }
}

export async function createCalendarEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = tenant(req); const userId = actor(req);
    const { academicYearId, classId, sectionId, appliesTo = "school" } = req.body;
    if (!await AcademicYear.exists({ _id: academicYearId, schoolId })) throw AppError.notFound("Academic year not found");
    await assertTargetOwnership(schoolId, appliesTo, classId, sectionId);
    const event = await AcademicCalendarEvent.create({ ...req.body, schoolId, createdBy: userId });
    await createAuditLog({ schoolId: schoolId.toString(), userId, action: "calendar.create", entity: "AcademicCalendarEvent", entityId: event._id.toString(), after: snapshot(event) });
    res.status(201).json(event);
  } catch (e) { next(e); }
}

export async function updateCalendarEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = tenant(req); const userId = actor(req);
    const event = await AcademicCalendarEvent.findOne({ _id: req.params.id, schoolId, isActive: true });
    if (!event) throw AppError.notFound("Calendar event not found");
    const before = snapshot(event);
    const academicYearId = String(req.body.academicYearId ?? event.academicYearId);
    const appliesTo = String(req.body.appliesTo ?? event.appliesTo);
    const classId = req.body.classId ?? event.classId?.toString();
    const sectionId = req.body.sectionId ?? event.sectionId?.toString();
    if (!await AcademicYear.exists({ _id: academicYearId, schoolId })) throw AppError.notFound("Academic year not found");
    await assertTargetOwnership(schoolId, appliesTo, classId, sectionId);
    Object.assign(event, { ...req.body, academicYearId, appliesTo, classId: appliesTo === "school" ? undefined : classId, sectionId: appliesTo === "section" ? sectionId : undefined });
    await event.save();
    await createAuditLog({ schoolId: schoolId.toString(), userId, action: "calendar.update", entity: "AcademicCalendarEvent", entityId: event._id.toString(), before, after: snapshot(event) });
    res.json(event);
  } catch (e) { next(e); }
}

export async function deleteCalendarEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = tenant(req); const userId = actor(req);
    const event = await AcademicCalendarEvent.findOneAndUpdate({ _id: req.params.id, schoolId, isActive: true }, { $set: { isActive: false } }, { new: true }).lean();
    if (!event) throw AppError.notFound("Calendar event not found");
    await createAuditLog({ schoolId: schoolId.toString(), userId, action: "calendar.archive", entity: "AcademicCalendarEvent", entityId: String(event._id), after: event as unknown as Record<string, unknown> });
    res.status(204).send();
  } catch (e) { next(e); }
}
