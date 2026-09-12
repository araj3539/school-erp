import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AcademicCalendarEvent, AcademicYear, Class, Section } from "../models/index.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog } from "../services/auditLog.js";

function tenant(req: Request): Types.ObjectId { const id = req.user?.schoolId; if (!id) throw AppError.forbidden("A school context is required"); return new Types.ObjectId(id); }
function actor(req: Request): Types.ObjectId { const id = req.user?.userId; if (!id) throw AppError.unauthorized("Authenticated user required"); return new Types.ObjectId(id); }

export async function listCalendarEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = tenant(req);
    const filter: Record<string, unknown> = { schoolId, isActive: true };
    if (req.query.academicYearId) filter.academicYearId = req.query.academicYearId;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.startDate || req.query.endDate) { filter.startDate = { ...(req.query.endDate ? { $lte: new Date(String(req.query.endDate)) } : {}), ...(req.query.startDate ? { $gte: new Date(String(req.query.startDate)) } : {}) }; }
    const events = await AcademicCalendarEvent.find(filter).sort({ startDate: 1, _id: 1 }).lean();
    res.json(events);
  } catch (e) { next(e); }
}

export async function createCalendarEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = tenant(req); const userId = actor(req);
    const { academicYearId, classId, sectionId } = req.body;
    const year = await AcademicYear.findOne({ _id: academicYearId, schoolId }).lean();
    if (!year) throw AppError.notFound("Academic year not found");
    if (classId && !await Class.exists({ _id: classId, schoolId })) throw AppError.badRequest("Class does not belong to this school");
    if (sectionId && !await Section.exists({ _id: sectionId, classId })) throw AppError.badRequest("Section does not belong to the selected class");
    const event = await AcademicCalendarEvent.create({ ...req.body, schoolId, createdBy: userId });
    await createAuditLog({ schoolId, userId, action: "calendar.create", entity: "AcademicCalendarEvent", entityId: event._id, after: event.toObject() });
    res.status(201).json(event);
  } catch (e) { next(e); }
}

export async function updateCalendarEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = tenant(req); const userId = actor(req);
    const event = await AcademicCalendarEvent.findOne({ _id: req.params.id, schoolId, isActive: true });
    if (!event) throw AppError.notFound("Calendar event not found");
    const before = event.toObject(); Object.assign(event, req.body); event.schoolId = schoolId; await event.save();
    await createAuditLog({ schoolId, userId, action: "calendar.update", entity: "AcademicCalendarEvent", entityId: event._id, before, after: event.toObject() });
    res.json(event);
  } catch (e) { next(e); }
}

export async function deleteCalendarEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = tenant(req); const userId = actor(req);
    const event = await AcademicCalendarEvent.findOneAndUpdate({ _id: req.params.id, schoolId, isActive: true }, { $set: { isActive: false } }, { new: true }).lean();
    if (!event) throw AppError.notFound("Calendar event not found");
    await createAuditLog({ schoolId, userId, action: "calendar.archive", entity: "AcademicCalendarEvent", entityId: event._id, after: event });
    res.status(204).send();
  } catch (e) { next(e); }
}
