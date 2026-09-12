import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AcademicYear, School } from "../models/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";

export async function getAcademicYears(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const years = await AcademicYear.find({ schoolId }).sort({ startDate: -1 }).lean();
    res.json({ data: years });
  } catch (error) { next(error); }
}

export async function createAcademicYear(req: Request, res: Response, next: NextFunction) {
  const session = await mongoose.startSession();
  try {
    const schoolId = getTenantId(req);
    const { name, startDate, endDate, isCurrent = false } = req.validatedBody as any;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) throw AppError.badRequest("Academic year end date must be after start date");
    let year: any;
    await session.withTransaction(async () => {
      const duplicate = await AcademicYear.findOne({ schoolId, name }).session(session);
      if (duplicate) throw AppError.conflict("Academic year name already exists");
      if (isCurrent) await AcademicYear.updateMany({ schoolId, isCurrent: true }, { $set: { isCurrent: false } }, { session });
      year = await AcademicYear.create([{ schoolId, name, startDate: start, endDate: end, isCurrent: Boolean(isCurrent) }], { session }).then((created) => created[0]);
      if (year.isCurrent) await School.findOneAndUpdate({ _id: schoolId }, { $set: { academicYear: year._id, session: year.name } }, { session });
      await createAuditLog({ schoolId: schoolId.toString(), userId: req.user!.userId, action: "CREATE", entity: "AcademicYear", entityId: year._id.toString(), after: { name: year.name, startDate: year.startDate, endDate: year.endDate, isCurrent: year.isCurrent }, session });
    });
    res.status(201).json({ academicYear: year });
  } catch (error) { next(error); } finally { await session.endSession(); }
}

export async function updateAcademicYear(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const { id } = req.validatedParams as any;
    const { name, startDate, endDate } = req.validatedBody as any;
    const existing = await AcademicYear.findOne({ _id: id, schoolId });
    if (!existing) throw AppError.notFound("Academic year not found");
    const nextStart = startDate ? new Date(startDate) : existing.startDate;
    const nextEnd = endDate ? new Date(endDate) : existing.endDate;
    if (nextEnd <= nextStart) throw AppError.badRequest("Academic year end date must be after start date");
    if (name && name !== existing.name) {
      const duplicate = await AcademicYear.findOne({ schoolId, name, _id: { $ne: id } });
      if (duplicate) throw AppError.conflict("Academic year name already exists");
    }
    const before = { name: existing.name, startDate: existing.startDate, endDate: existing.endDate };
    Object.assign(existing, { name: name ?? existing.name, startDate: nextStart, endDate: nextEnd });
    await existing.save();
    if (existing.isCurrent) await School.findOneAndUpdate({ _id: schoolId }, { $set: { session: existing.name } });
    await createAuditLog({ schoolId: schoolId.toString(), userId: req.user!.userId, action: "UPDATE", entity: "AcademicYear", entityId: id, before, after: { name: existing.name, startDate: existing.startDate, endDate: existing.endDate } });
    res.json({ academicYear: existing });
  } catch (error) { next(error); }
}

export async function setCurrentAcademicYear(req: Request, res: Response, next: NextFunction) {
  const session = await mongoose.startSession();
  try {
    const schoolId = getTenantId(req);
    const { id } = req.validatedParams as any;
    let year: any;
    await session.withTransaction(async () => {
      year = await AcademicYear.findOne({ _id: id, schoolId }).session(session);
      if (!year) throw AppError.notFound("Academic year not found");
      await AcademicYear.updateMany({ schoolId, _id: { $ne: id }, isCurrent: true }, { $set: { isCurrent: false } }, { session });
      year.isCurrent = true;
      await year.save({ session });
      await School.findOneAndUpdate({ _id: schoolId }, { $set: { academicYear: year._id, session: year.name } }, { session });
      await createAuditLog({ schoolId: schoolId.toString(), userId: req.user!.userId, action: "SET_CURRENT", entity: "AcademicYear", entityId: id, after: { name: year.name }, session });
    });
    res.json({ academicYear: year });
  } catch (error) { next(error); } finally { await session.endSession(); }
}
