import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import { Attendance } from "../models/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { UserRole } from "@school-erp/shared";

function managementOnly(req: Request) {
  if (req.user!.role !== UserRole.PRINCIPAL && req.user!.role !== UserRole.SUPER_ADMIN) throw AppError.forbidden("Only school management can perform this attendance workflow action");
}

async function findAttendance(req: Request, id: string, session?: mongoose.ClientSession) {
  if (!Types.ObjectId.isValid(id)) throw AppError.badRequest("Invalid attendance id");
  const query = Attendance.findOne({ _id: id, schoolId: getTenantId(req) });
  if (session) query.session(session);
  const attendance = await query;
  if (!attendance) throw AppError.notFound("Attendance record not found");
  return attendance;
}

export async function lockAttendance(req: Request, res: Response, next: NextFunction) {
  const session = await mongoose.startSession();
  try {
    managementOnly(req);
    const attendanceId = (req.validatedParams as any).id;
    let attendance: any;
    await session.withTransaction(async () => {
      attendance = await findAttendance(req, attendanceId, session);
      if (attendance.lifecycle === "LOCKED") return;
      if (attendance.lifecycle === "CORRECTION_REQUESTED") throw AppError.conflict("Attendance has a pending correction request");
      attendance.lifecycle = "LOCKED";
      attendance.lockedAt = new Date();
      attendance.lockedBy = new Types.ObjectId(req.user!.userId);
      await attendance.save({ session });
      await createAuditLog({ schoolId: getTenantId(req), userId: req.user!.userId, action: "LOCK", entity: "Attendance", entityId: attendance._id.toString(), after: { lifecycle: attendance.lifecycle, lockedAt: attendance.lockedAt }, session });
    });
    res.json({ attendance });
  } catch (error) { next(error); } finally { await session.endSession(); }
}

export async function requestAttendanceCorrection(req: Request, res: Response, next: NextFunction) {
  const session = await mongoose.startSession();
  try {
    const { reason } = req.validatedBody as any;
    const attendanceId = (req.validatedParams as any).id;
    let attendance: any;
    await session.withTransaction(async () => {
      attendance = await findAttendance(req, attendanceId, session);
      if (attendance.lifecycle !== "LOCKED") throw AppError.conflict("Only locked attendance requires a correction request");
      attendance.lifecycle = "CORRECTION_REQUESTED";
      attendance.corrections.push({ requestedBy: new Types.ObjectId(req.user!.userId), requestedAt: new Date(), reason });
      await attendance.save({ session });
      await createAuditLog({ schoolId: getTenantId(req), userId: req.user!.userId, action: "CORRECTION_REQUEST", entity: "Attendance", entityId: attendance._id.toString(), after: { reason }, session });
    });
    res.status(200).json({ attendance });
  } catch (error) { next(error); } finally { await session.endSession(); }
}

export async function applyAttendanceCorrection(req: Request, res: Response, next: NextFunction) {
  const session = await mongoose.startSession();
  try {
    managementOnly(req);
    const { records, reason } = req.validatedBody as any;
    const attendanceId = (req.validatedParams as any).id;
    let attendance: any;
    await session.withTransaction(async () => {
      attendance = await findAttendance(req, attendanceId, session);
      if (attendance.lifecycle !== "CORRECTION_REQUESTED") throw AppError.conflict("Attendance is not awaiting an approved correction");
      const before = attendance.records.map((r: any) => ({ studentId: r.studentId.toString(), status: r.status, remark: r.remark }));
      attendance.records = records.map((r: any) => ({ ...r, studentId: new Types.ObjectId(r.studentId) }));
      attendance.lifecycle = "CORRECTED";
      attendance.corrections[attendance.corrections.length - 1].correctedBy = new Types.ObjectId(req.user!.userId);
      attendance.corrections[attendance.corrections.length - 1].correctedAt = new Date();
      await attendance.save({ session });
      await createAuditLog({ schoolId: getTenantId(req), userId: req.user!.userId, action: "CORRECT", entity: "Attendance", entityId: attendance._id.toString(), before: { records: before }, after: { records: attendance.records, reason }, session });
    });
    res.json({ attendance });
  } catch (error) { next(error); } finally { await session.endSession(); }
}
