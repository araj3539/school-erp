import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Student, StudentLifecycleEvent } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { createAuditLog } from "../services/auditLog.js";
import { StudentStatus, UserRole } from "@school-erp/shared";

const MANAGEMENT_ROLES = new Set([UserRole.SUPER_ADMIN, UserRole.PRINCIPAL, UserRole.SUPPORT_ADMIN]);
const TERMINAL_STATUSES = new Set([StudentStatus.GRADUATED, StudentStatus.TRANSFERRED, StudentStatus.LEFT]);
const ALLOWED_TRANSITIONS: Record<StudentStatus, StudentStatus[]> = {
  [StudentStatus.ACTIVE]: [StudentStatus.LEFT, StudentStatus.GRADUATED, StudentStatus.TRANSFERRED],
  [StudentStatus.LEFT]: [StudentStatus.ACTIVE],
  [StudentStatus.TRANSFERRED]: [StudentStatus.ACTIVE],
  [StudentStatus.GRADUATED]: []
};

function assertManagement(req: Request): void {
  if (!MANAGEMENT_ROLES.has(req.user!.role)) throw AppError.forbidden("Only school management can change student lifecycle status");
}
function parseStatus(value: unknown): StudentStatus {
  if (!Object.values(StudentStatus).includes(value as StudentStatus)) throw AppError.badRequest("Invalid student lifecycle status");
  return value as StudentStatus;
}

export async function transitionStudentLifecycle(req: Request, res: Response, next: NextFunction) {
  try {
    assertManagement(req);
    const { id } = req.validatedParams as { id: string };
    const body = req.validatedBody as { toStatus: string; reason: string; effectiveAt?: string; metadata?: Record<string, unknown> };
    const toStatus = parseStatus(body.toStatus);
    const schoolId = getTenantId(req);
    const session = await mongoose.startSession();
    let event: any;
    let student: any;
    try {
      await session.withTransaction(async () => {
        student = await Student.findOne({ _id: id, schoolId }).session(session);
        if (!student) throw AppError.notFound("Student not found");
        const fromStatus = student.status as StudentStatus;
        if (fromStatus === toStatus) throw AppError.conflict("Student is already in the requested status");
        if (!ALLOWED_TRANSITIONS[fromStatus]?.includes(toStatus)) throw AppError.conflict(`Invalid student lifecycle transition: ${fromStatus} -> ${toStatus}`);
        if (TERMINAL_STATUSES.has(toStatus) && !body.reason.trim()) throw AppError.badRequest("A reason is required for terminal lifecycle changes");
        const effectiveAt = body.effectiveAt ? new Date(body.effectiveAt) : new Date();
        if (Number.isNaN(effectiveAt.getTime())) throw AppError.badRequest("Invalid effectiveAt");
        student.status = toStatus;
        await student.save({ session });
        [event] = await StudentLifecycleEvent.create([{ schoolId, studentId: student._id, fromStatus, toStatus, reason: body.reason.trim(), effectiveAt, actorId: req.user!.userId, classId: student.classId, sectionId: student.sectionId, metadata: body.metadata }], { session });
      });
    } finally { await session.endSession(); }
    await createAuditLog({ userId: req.user!.userId, action: "STUDENT_LIFECYCLE_CHANGE", entity: "Student", entityId: id, before: { status: event.fromStatus }, after: { status: event.toStatus, reason: event.reason, effectiveAt: event.effectiveAt } });
    res.json({ student, event });
  } catch (error) { next(error); }
}

export async function getStudentLifecycleHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const query = req.validatedQuery as { page: number; limit: number; fromStatus?: string; toStatus?: string };
    const schoolId = getTenantId(req);
    if (!await Student.exists({ _id: id, schoolId })) throw AppError.notFound("Student not found");
    const filter: any = { schoolId, studentId: id };
    if (query.fromStatus) filter.fromStatus = parseStatus(query.fromStatus);
    if (query.toStatus) filter.toStatus = parseStatus(query.toStatus);
    const skip = (query.page - 1) * query.limit;
    const [events, total] = await Promise.all([
      StudentLifecycleEvent.find(filter).sort({ effectiveAt: -1, createdAt: -1 }).skip(skip).limit(query.limit).populate("actorId", "email role").populate("classId", "name displayName").populate("sectionId", "name").lean(),
      StudentLifecycleEvent.countDocuments(filter)
    ]);
    res.json({ data: events, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
  } catch (error) { next(error); }
}
