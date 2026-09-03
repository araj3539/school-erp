import { Request, Response, NextFunction } from "express";
import { Class, Notice, Section, Student, Teacher } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { createAuditLog } from "../services/auditLog.js";
import { UserRole } from "@school-erp/shared";

const tenantFilter = (req: Request, extra: Record<string, unknown> = {}) => ({ schoolId: getTenantId(req), ...extra });
const canManage = (req: Request) => req.user!.role === UserRole.SUPER_ADMIN || req.user!.role === UserRole.PRINCIPAL;

async function validateTarget(req: Request, data: any) {
  const schoolId = getTenantId(req);
  if (data.audience === "school") return;
  const klass = await Class.findOne({ _id: data.classId, schoolId }).select("_id").lean();
  if (!klass) throw AppError.badRequest("Class must belong to this school");
  if (data.audience === "section") {
    const section = await Section.findOne({ _id: data.sectionId, classId: data.classId }).select("_id").lean();
    if (!section) throw AppError.badRequest("Section must belong to the selected class");
  }
}

async function asyncTargetFilter(req: Request) {
  if (req.user!.role === UserRole.STUDENT) {
    const student: any = await Student.findOne({ schoolId: getTenantId(req), userId: req.user!.userId, status: "active" }).select("classId sectionId").lean();
    if (!student) return { _id: null };
    return { $or: [{ audience: "school" }, { audience: "class", classId: student.classId }, { audience: "section", classId: student.classId, sectionId: student.sectionId }] };
  }
  if (req.user!.role === UserRole.PARENT) {
    const children: any[] = await Student.find({ schoolId: getTenantId(req), parentIds: req.user!.userId, status: "active" }).select("classId sectionId").lean();
    if (!children.length) return { _id: null };
    return { $or: [{ audience: "school" }, ...children.flatMap((child) => [{ audience: "class", classId: child.classId }, { audience: "section", classId: child.classId, sectionId: child.sectionId }])] };
  }
  if (req.user!.role === UserRole.TEACHER) {
    const teacher: any = await Teacher.findOne({ schoolId: getTenantId(req), userId: req.user!.userId }).select("classTeacherOf").lean();
    return teacher?.classTeacherOf?.length ? { $or: [{ audience: "school" }, { audience: "class", classId: { $in: teacher.classTeacherOf } }] } : { audience: "school" };
  }
  return { audience: "school" };
}

export async function getNotices(req: Request, res: Response, next: NextFunction) {
  try {
    const q: any = req.validatedQuery || {};
    const filter: any = tenantFilter(req);
    if (!canManage(req) || q.includeUnpublished !== true) {
      filter.publishAt = { $lte: new Date() };
      filter.$and = [{ $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] }];
      Object.assign(filter, await asyncTargetFilter(req));
    }
    if (q.priority) filter.priority = q.priority;
    const skip = (q.page - 1) * q.limit;
    const [data, total] = await Promise.all([
      Notice.find(filter).populate("classId sectionId createdBy").sort({ priority: -1, publishAt: -1 }).skip(skip).limit(q.limit).lean(),
      Notice.countDocuments(filter),
    ]);
    res.json({ data, pagination: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) } });
  } catch (e) { next(e); }
}

export async function createNotice(req: Request, res: Response, next: NextFunction) {
  try {
    const data: any = req.validatedBody;
    await validateTarget(req, data);
    const notice = await Notice.create({ ...data, schoolId: getTenantId(req), createdBy: req.user!.userId });
    await createAuditLog({ userId: req.user!.userId, action: "CREATE", entity: "Notice", entityId: notice._id.toString(), after: { title: notice.title, audience: notice.audience, classId: notice.classId?.toString(), sectionId: notice.sectionId?.toString(), publishAt: notice.publishAt, expiresAt: notice.expiresAt } });
    res.status(201).json({ notice });
  } catch (e) { next(e); }
}

export async function updateNotice(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const existing: any = await Notice.findOne(tenantFilter(req, { _id: id }));
    if (!existing) throw AppError.notFound("Notice not found");
    const data: any = req.validatedBody;
    const merged = { ...existing.toObject(), ...data };
    await validateTarget(req, merged);
    const before = { title: existing.title, audience: existing.audience, classId: existing.classId?.toString(), sectionId: existing.sectionId?.toString(), publishAt: existing.publishAt, expiresAt: existing.expiresAt };
    Object.assign(existing, data, { updatedBy: req.user!.userId });
    await existing.save();
    await createAuditLog({ userId: req.user!.userId, action: "UPDATE", entity: "Notice", entityId: existing._id.toString(), before, after: { title: existing.title, audience: existing.audience, classId: existing.classId?.toString(), sectionId: existing.sectionId?.toString(), publishAt: existing.publishAt, expiresAt: existing.expiresAt } });
    res.json({ notice: existing });
  } catch (e) { next(e); }
}
