import { randomUUID } from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Class, Homework, Section, Student, Subject, AcademicYear, Teacher } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { createAuditLog } from "../services/auditLog.js";
import { buildR2Key, deleteFromR2, getR2SignedUrl, sanitizeFileName, uploadToR2 } from "../services/r2.js";
import { UserRole } from "@school-erp/shared";

interface MulterRequest extends Request { file?: Express.Multer.File; }
const MAX_HOMEWORK_ATTACHMENTS = 10;
const SIGNED_URL_EXPIRY = 600;

function tenantFilter(req: Request, extra: Record<string, unknown> = {}) { return { schoolId: getTenantId(req), ...extra } as Record<string, any>; }
function publicHomework(homework: any) { return { ...homework, attachments: (homework.attachments ?? []).map((item: any) => ({ _id: item._id, name: item.name, size: item.size, mimeType: item.mimeType, uploadedAt: item.uploadedAt })) }; }

async function assertTeacherCanManage(req: Request, homework: { classId: any; subjectId: any }) {
  if (req.user!.role !== UserRole.TEACHER) return;
  const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: getTenantId(req) }).select("subjects classTeacherOf").lean();
  if (!teacher) throw AppError.forbidden("Teacher profile not found");
  const classAllowed = teacher.classTeacherOf?.some((id: any) => id.toString() === homework.classId.toString());
  const subjectAllowed = teacher.subjects?.some((id: any) => id.toString() === homework.subjectId.toString());
  if (!classAllowed && !subjectAllowed) throw AppError.forbidden("You are not assigned to this class or subject");
}

async function validateAcademicTarget(req: Request, data: any) {
  const schoolId = getTenantId(req);
  const [year, klass, subject] = await Promise.all([
    AcademicYear.findOne({ _id: data.academicYearId, schoolId }).select("_id").lean(),
    Class.findOne({ _id: data.classId, schoolId }).select("_id").lean(),
    Subject.findOne({ _id: data.subjectId, schoolId, classIds: data.classId }).select("_id").lean(),
  ]);
  if (!year) throw AppError.badRequest("Academic year must belong to this school");
  if (!klass) throw AppError.badRequest("Class must belong to this school");
  if (!subject) throw AppError.badRequest("Subject must belong to this school and class");
  if (data.sectionId) {
    const section = await Section.findOne({ _id: data.sectionId, classId: data.classId }).select("_id").lean();
    if (!section) throw AppError.badRequest("Section must belong to the selected class");
  }
}

async function assertHomeworkReadAccess(req: Request, homework: { classId: any; sectionId?: any }) {
  const schoolId = getTenantId(req);
  const classId = homework.classId?._id ?? homework.classId;
  const sectionId = homework.sectionId?._id ?? homework.sectionId;
  if (req.user!.role === UserRole.STUDENT) {
    const student = await Student.findOne({ schoolId, userId: req.user!.userId, status: "active", classId, $or: [{ sectionId }, { sectionId: { $exists: false } }] }).select("_id").lean();
    if (!student) throw AppError.forbidden("You can only view homework assigned to your class");
  }
  if (req.user!.role === UserRole.PARENT) {
    const child = await Student.findOne({ schoolId, parentIds: req.user!.userId, status: "active", classId, $or: [{ sectionId }, { sectionId: { $exists: false } }] }).select("_id").lean();
    if (!child) throw AppError.forbidden("You can only view homework assigned to your child");
  }
}

export async function getHomework(req: Request, res: Response, next: NextFunction) {
  try {
    const q: any = req.validatedQuery || {};
    const filter: any = tenantFilter(req);
    if (q.classId) filter.classId = q.classId;
    if (q.sectionId) filter.sectionId = q.sectionId;
    if (q.subjectId) filter.subjectId = q.subjectId;
    if (q.academicYearId) filter.academicYearId = q.academicYearId;
    if (q.assignedDate) filter.assignedDate = q.assignedDate;
    if (q.dueDate) filter.dueDate = q.dueDate;
    if (req.user!.role === UserRole.STUDENT) {
      const student = await Student.findOne({ schoolId: getTenantId(req), userId: req.user!.userId, status: "active" }).select("classId sectionId").lean();
      if (!student) return res.json({ data: [], pagination: { page: q.page, limit: q.limit, total: 0, totalPages: 0 } });
      filter.classId = student.classId;
      filter.$or = [{ sectionId: student.sectionId }, { sectionId: { $exists: false } }];
    }
    if (req.user!.role === UserRole.PARENT) {
      const children = await Student.find({ schoolId: getTenantId(req), parentIds: req.user!.userId, status: "active" }).select("classId sectionId").lean();
      if (!children.length) return res.json({ data: [], pagination: { page: q.page, limit: q.limit, total: 0, totalPages: 0 } });
      filter.$or = children.flatMap((child: any) => [{ classId: child.classId, sectionId: child.sectionId }, { classId: child.classId, sectionId: { $exists: false } }]);
    }
    const skip = (q.page - 1) * q.limit;
    const [data, total] = await Promise.all([Homework.find(filter).populate("classId sectionId subjectId academicYearId createdBy").sort({ dueDate: 1, assignedDate: -1, createdAt: -1 }).skip(skip).limit(q.limit).lean(), Homework.countDocuments(filter)]);
    res.json({ data: data.map(publicHomework), pagination: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) } });
  } catch (e) { next(e); }
}

export async function getHomeworkById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const homework: any = await Homework.findOne(tenantFilter(req, { _id: id })).populate("classId sectionId subjectId academicYearId createdBy").lean();
    if (!homework) throw AppError.notFound("Homework not found");
    await assertHomeworkReadAccess(req, homework);
    res.json({ homework: publicHomework(homework) });
  } catch (e) { next(e); }
}

export async function createHomework(req: Request, res: Response, next: NextFunction) {
  try {
    const data: any = req.validatedBody;
    await validateAcademicTarget(req, data);
    await assertTeacherCanManage(req, data);
    const homework = await Homework.create({ ...data, schoolId: getTenantId(req), attachments: [], createdBy: req.user!.userId });
    await createAuditLog({ userId: req.user!.userId, action: "CREATE", entity: "Homework", entityId: homework._id.toString(), after: { title: homework.title, classId: homework.classId.toString(), sectionId: homework.sectionId?.toString(), subjectId: homework.subjectId.toString(), dueDate: homework.dueDate } });
    res.status(201).json({ homework: publicHomework(homework.toObject()) });
  } catch (e) { next(e); }
}

export async function updateHomework(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const existing: any = await Homework.findOne(tenantFilter(req, { _id: id }));
    if (!existing) throw AppError.notFound("Homework not found");
    await assertTeacherCanManage(req, existing);
    const data: any = req.validatedBody;
    const merged = { ...existing.toObject(), ...data };
    await validateAcademicTarget(req, merged);
    await assertTeacherCanManage(req, merged);
    const before = { title: existing.title, classId: existing.classId.toString(), sectionId: existing.sectionId?.toString(), subjectId: existing.subjectId.toString(), assignedDate: existing.assignedDate, dueDate: existing.dueDate };
    Object.assign(existing, data, { updatedBy: req.user!.userId });
    await existing.save();
    await createAuditLog({ userId: req.user!.userId, action: "UPDATE", entity: "Homework", entityId: existing._id.toString(), before, after: { title: existing.title, classId: existing.classId.toString(), sectionId: existing.sectionId?.toString(), subjectId: existing.subjectId.toString(), assignedDate: existing.assignedDate, dueDate: existing.dueDate } });
    res.json({ homework: publicHomework(existing.toObject()) });
  } catch (e) { next(e); }
}

export async function uploadHomeworkAttachment(req: MulterRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    if (!req.file) throw AppError.badRequest("Attachment file is required");
    const homework: any = await Homework.findOne(tenantFilter(req, { _id: id }));
    if (!homework) throw AppError.notFound("Homework not found");
    await assertTeacherCanManage(req, homework);
    if (homework.attachments.length >= MAX_HOMEWORK_ATTACHMENTS) throw AppError.badRequest("Homework cannot have more than 10 attachments");
    const schoolId = getTenantId(req);
    const key = buildR2Key(["schools", schoolId, "homework", id, "attachments", `${randomUUID()}-${sanitizeFileName(req.file.originalname)}`]);
    try {
      await uploadToR2(req.file.buffer, key, req.file.mimetype);
      const attachment = { _id: new Types.ObjectId(), name: req.file.originalname, storageKey: key, size: req.file.size, mimeType: req.file.mimetype, uploadedAt: new Date() };
      homework.attachments.push(attachment);
      await homework.save();
      await createAuditLog({ userId: req.user!.userId, action: "UPLOAD_ATTACHMENT", entity: "Homework", entityId: id, after: { attachmentId: attachment._id.toString(), name: attachment.name, size: attachment.size, mimeType: attachment.mimeType } });
      res.status(201).json({ attachment: { _id: attachment._id, name: attachment.name, size: attachment.size, mimeType: attachment.mimeType, uploadedAt: attachment.uploadedAt } });
    } catch (error) {
      try { await deleteFromR2(key); } catch (cleanupError) { console.error("[Homework] Attachment cleanup failed", cleanupError); }
      throw error;
    }
  } catch (e) { next(e); }
}

export async function getHomeworkAttachmentUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, attachmentId } = req.validatedParams as { id: string; attachmentId: string };
    const homework: any = await Homework.findOne(tenantFilter(req, { _id: id })).select("classId sectionId attachments").lean();
    if (!homework) throw AppError.notFound("Homework not found");
    await assertHomeworkReadAccess(req, homework);
    const attachment = homework.attachments.find((item: any) => item._id?.toString() === attachmentId);
    if (!attachment) throw AppError.notFound("Attachment not found");
    if (!attachment.storageKey) throw AppError.notFound("Attachment storage key is missing; please re-upload this file");
    const url = await getR2SignedUrl(attachment.storageKey, SIGNED_URL_EXPIRY);
    res.json({ url, expiresIn: SIGNED_URL_EXPIRY });
  } catch (e) { next(e); }
}

export async function deleteHomeworkAttachment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, attachmentId } = req.validatedParams as { id: string; attachmentId: string };
    const homework: any = await Homework.findOne(tenantFilter(req, { _id: id }));
    if (!homework) throw AppError.notFound("Homework not found");
    await assertTeacherCanManage(req, homework);
    const index = homework.attachments.findIndex((item: any) => item._id?.toString() === attachmentId);
    if (index < 0) throw AppError.notFound("Attachment not found");
    const attachment = homework.attachments[index];
    if (!attachment.storageKey) throw AppError.notFound("Attachment storage key is missing; please re-upload this file");
    const expectedPrefix = buildR2Key(["schools", getTenantId(req), "homework", id, "attachments"]);
    if (!attachment.storageKey.startsWith(`${expectedPrefix}/`)) throw AppError.forbidden("Attachment does not belong to this homework");
    await deleteFromR2(attachment.storageKey);
    homework.attachments.splice(index, 1);
    await homework.save();
    await createAuditLog({ userId: req.user!.userId, action: "DELETE_ATTACHMENT", entity: "Homework", entityId: id, after: { attachmentId, name: attachment.name } });
    res.json({ message: "Attachment deleted" });
  } catch (e) { next(e); }
}
