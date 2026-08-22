import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { DocumentRecovery, Student, Teacher } from "../models/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { backupR2ToB2, buildRecoveryKey, copyR2ObjectToRecovery, getB2RecoverySignedUrl, getB2Object } from "../services/documentRecovery.js";
import { uploadStreamToR2 } from "../services/r2.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { UserRole } from "@school-erp/shared";
const RETENTION_MS = 60 * 24 * 60 * 60 * 1000;

async function assertStudentReadAccess(req: Request, studentId: string): Promise<void> {
  const schoolId = getTenantId(req);
  if (req.user!.role === UserRole.STUDENT) {
    const own = await Student.exists({ _id: studentId, schoolId, userId: req.user!.userId });
    if (!own) throw AppError.forbidden("Students can only access their own document recovery");
    return;
  }
  if (req.user!.role === UserRole.PARENT) {
    const child = await Student.exists({ _id: studentId, schoolId, parentIds: req.user!.userId });
    if (!child) throw AppError.forbidden("Parents can only access recovery files for linked children");
    return;
  }
  if (req.user!.role === UserRole.TEACHER) {
    const [student, teacher] = await Promise.all([
      Student.findOne({ _id: studentId, schoolId }).select("classId").lean(),
      Teacher.findOne({ userId: req.user!.userId, schoolId }).select("classTeacherOf").lean()
    ]);
    if (!student) throw AppError.notFound("Student not found");
    const assigned = teacher?.classTeacherOf?.some((id: mongoose.Types.ObjectId) => id.toString() === student.classId?.toString());
    if (!assigned) throw AppError.forbidden("You are not assigned to this student's class");
  }
}

function recoveryFilter(req: Request) { const { recoveryId } = req.params as any; return { _id: recoveryId, schoolId: getTenantId(req), studentId: (req.params as any).id }; }

function publicRecovery(item: any, now = new Date()) {
  return {
    _id: item._id,
    schoolId: item.schoolId,
    studentId: item.studentId,
    documentType: item.documentType,
    originalName: item.originalName,
    mimeType: item.mimeType,
    sizeBytes: item.sizeBytes,
    deletedAt: item.deletedAt,
    expiresAt: item.expiresAt,
    source: item.source,
    status: item.status,
    restoredAt: item.restoredAt,
    restoredBy: item.restoredBy,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    recoverable: item.status === "available" && new Date(item.expiresAt) > now,
  };
}

function publicDocument(document: any) {
  if (!document) return undefined;
  return {
    _id: document._id,
    type: document.type,
    originalName: document.originalName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    uploadedAt: document.uploadedAt,
  };
}

export async function getStudentDocumentRecoveryHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as any;
    await assertStudentReadAccess(req, id);
    const schoolId = getTenantId(req);
    const documentType = String(req.query.type || "").trim().toLowerCase();
    const student = await Student.exists({ _id: id, schoolId });
    if (!student) throw AppError.notFound("Student not found");
    const filter: any = { schoolId, studentId: id };
    if (documentType) filter.documentType = documentType;
    const recoveries = await DocumentRecovery.find(filter).sort({ deletedAt: -1 }).lean();
    res.json({ data: recoveries.map((item: any) => publicRecovery(item)) });
  } catch (error) { next(error); }
}

export async function previewStudentDocumentRecovery(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as any;
    await assertStudentReadAccess(req, id);
    const recovery = await DocumentRecovery.findOne({ ...recoveryFilter(req), status: "available", expiresAt: { $gt: new Date() } }).lean();
    if (!recovery) throw AppError.notFound("Recovery file not found or expired");
    const url = await getB2RecoverySignedUrl(recovery.recoveryKey, 600);
    res.json({ recovery: publicRecovery(recovery), url, expiresIn: 600 });
  } catch (error) { next(error); }
}

export async function restoreStudentDocumentRecovery(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as any;
    if (req.user!.role === UserRole.STUDENT || req.user!.role === UserRole.PARENT || req.user!.role === UserRole.TEACHER) {
      throw AppError.forbidden("Only authorized school administrators can restore documents");
    }
    await assertStudentReadAccess(req, id);
    const schoolId = getTenantId(req);
    const recovery = await DocumentRecovery.findOne({ ...recoveryFilter(req), status: "available", expiresAt: { $gt: new Date() } });
    if (!recovery) throw AppError.notFound("Recovery file not found or expired");
    const student = await Student.findOne({ _id: id, schoolId });
    if (!student) throw AppError.notFound("Student not found");
    const existing = student.documents.find((document: any) => document.type === recovery.documentType);
    if (existing?.url) {
      const archivedAt = new Date();
      const archiveKey = buildRecoveryKey(existing.url, archivedAt);
      await copyR2ObjectToRecovery(existing.url, archiveKey);
      await DocumentRecovery.create({ schoolId, studentId: id, documentType: existing.type, storageKey: existing.url, recoveryKey: archiveKey, originalName: existing.originalName, mimeType: existing.mimeType, sizeBytes: existing.sizeBytes, deletedAt: archivedAt, expiresAt: new Date(archivedAt.getTime() + RETENTION_MS), source: "manual-archive", status: "available" });
    }
    const source = await getB2Object(recovery.recoveryKey);
    await uploadStreamToR2(source.body, recovery.storageKey, recovery.mimeType || source.contentType, recovery.sizeBytes ?? source.contentLength);
    const metadata = { originalName: recovery.originalName || recovery.documentType, mimeType: recovery.mimeType || source.contentType || "application/octet-stream", sizeBytes: recovery.sizeBytes ?? source.contentLength ?? 0, uploadedAt: new Date() };
    if (existing) Object.assign(existing, { url: recovery.storageKey, ...metadata });
    else student.documents.push({ _id: new mongoose.Types.ObjectId(), type: recovery.documentType, url: recovery.storageKey, ...metadata } as any);
    await student.save();
    recovery.status = "restored";
    recovery.restoredAt = new Date();
    recovery.restoredBy = new mongoose.Types.ObjectId(req.user!.userId);
    await recovery.save();
    await createAuditLog({ userId: req.user!.userId, action: "RESTORE_DOCUMENT", entity: "Student", entityId: student._id.toString(), after: { recoveryId: recovery._id.toString(), documentType: recovery.documentType } });
    const restoredDocument = student.documents.find((document: any) => document.type === recovery.documentType);
    res.json({ message: "Document restored successfully", document: publicDocument(restoredDocument), recovery: publicRecovery(recovery) });
  } catch (error) { next(error); }
}

export async function runManualStorageBackup(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await backupR2ToB2();
    await createAuditLog({ userId: req.user!.userId, action: "MANUAL_BACKUP", entity: "Storage", entityId: getTenantId(req), after: result });
    res.json({ message: "Backup completed successfully", ...result, completedAt: new Date().toISOString() });
  } catch (error) { next(error); }
}
