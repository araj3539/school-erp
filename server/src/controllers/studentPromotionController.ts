import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Class, Section, Student, StudentLifecycleEvent } from "../models/index.js";
import { StudentStatus, UserRole } from "@school-erp/shared";
import { getTenantId } from "../utils/tenant.js";
import { AppError } from "../utils/errors.js";
import { createAuditLog } from "../services/auditLog.js";

const MANAGEMENT_ROLES = new Set([UserRole.SUPER_ADMIN, UserRole.PRINCIPAL, UserRole.SUPPORT_ADMIN]);
function assertManagement(req: Request) { if (!MANAGEMENT_ROLES.has(req.user!.role)) throw AppError.forbidden("Only school management can run student promotion"); }

async function resolvePromotion(req: Request) {
  const body = req.validatedBody as any;
  const schoolId = getTenantId(req);
  const [source, target, targetSection] = await Promise.all([
    Class.findOne({ _id: body.sourceClassId, schoolId }).lean(),
    Class.findOne({ _id: body.targetClassId, schoolId }).lean(),
    body.targetSectionId ? Section.findOne({ _id: body.targetSectionId, schoolId }).lean() : Promise.resolve(null)
  ]);
  if (!source) throw AppError.notFound("Source class not found");
  if (!target) throw AppError.notFound("Target class not found");
  if (source._id.toString() === target._id.toString()) throw AppError.badRequest("Promotion target must be a different class");
  if (body.targetSectionId && (!targetSection || targetSection.classId.toString() !== target._id.toString())) throw AppError.badRequest("Target section must belong to the target class");
  const filter: any = { schoolId, classId: source._id, status: StudentStatus.ACTIVE };
  if (body.studentIds?.length) filter._id = { $in: body.studentIds };
  const students = await Student.find(filter).select("_id admissionNo firstName lastName classId sectionId status").lean();
  const requested = body.studentIds?.length ?? students.length;
  const missing = body.studentIds?.length ? body.studentIds.filter((id: string) => !students.some((s) => s._id.toString() === id)) : [];
  if (missing.length) throw AppError.conflict(`${missing.length} selected student(s) are not active members of the source class`);
  const targetCount = await Student.countDocuments({ schoolId, classId: target._id, status: StudentStatus.ACTIVE, ...(body.targetSectionId ? { sectionId: body.targetSectionId } : {}) });
  const capacity = body.targetSectionId ? targetSection!.capacity : target.capacity;
  const available = Math.max(0, capacity - targetCount);
  return { body, schoolId, source, target, targetSection, students, requested, targetCount, capacity, available };
}

export async function previewStudentPromotion(req: Request, res: Response, next: NextFunction) {
  try {
    assertManagement(req);
    const result = await resolvePromotion(req);
    const capacityShortfall = Math.max(0, result.students.length - result.available);
    res.json({ preview: { sourceClass: result.source, targetClass: result.target, targetSection: result.targetSection, eligible: result.students, targetOccupancy: result.targetCount, targetCapacity: result.capacity, availableCapacity: result.available, capacityShortfall, canExecute: capacityShortfall === 0 && result.students.length > 0, requestedStudents: result.requested } });
  } catch (error) { next(error); }
}

export async function executeStudentPromotion(req: Request, res: Response, next: NextFunction) {
  try {
    assertManagement(req);
    const result = await resolvePromotion(req);
    if (!result.students.length) throw AppError.conflict("No eligible active students found for promotion");
    if (result.students.length > result.available) throw AppError.conflict(`Target capacity exceeded by ${result.students.length - result.available} student(s)`);
    const session = await mongoose.startSession();
    let promoted = 0;
    try {
      await session.withTransaction(async () => {
        for (const student of result.students) {
          const updated = await Student.findOneAndUpdate({ _id: student._id, schoolId: result.schoolId, classId: result.source._id, status: StudentStatus.ACTIVE }, { $set: { classId: result.target._id, ...(result.body.targetSectionId ? { sectionId: result.body.targetSectionId } : {}) } }, { new: true, session });
          if (!updated) throw AppError.conflict(`Student ${student.admissionNo} changed while promotion was running`);
          await StudentLifecycleEvent.create([{ schoolId: result.schoolId, studentId: updated._id, fromStatus: StudentStatus.ACTIVE, toStatus: StudentStatus.ACTIVE, reason: result.body.reason, effectiveAt: new Date(), actorId: req.user!.userId, classId: updated.classId, sectionId: updated.sectionId, metadata: { type: "promotion", sourceClassId: result.source._id.toString(), targetClassId: result.target._id.toString(), targetSectionId: result.body.targetSectionId ?? null } }], { session });
          promoted += 1;
        }
      });
    } finally { await session.endSession(); }
    await createAuditLog({ userId: req.user!.userId, action: "STUDENT_PROMOTION", entity: "Student", entityId: result.target._id.toString(), after: { sourceClassId: result.source._id, targetClassId: result.target._id, targetSectionId: result.body.targetSectionId, count: promoted, reason: result.body.reason } });
    res.json({ message: "Student promotion completed", promoted, sourceClassId: result.source._id, targetClassId: result.target._id, targetSectionId: result.body.targetSectionId ?? null });
  } catch (error) { next(error); }
}
