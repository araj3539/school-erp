import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import sharp from "sharp";
import { Student, DocumentRecovery, Teacher } from "../models/index.js";
import { CreateStudentSchema } from "../validators/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { getTenantId, withTenant } from "../utils/tenant.js";
import { escapeRegex } from "../utils/strings.js";
import { buildR2Key, uploadToR2, getR2SignedUrl, deleteFromR2 } from "../services/r2.js";
import { buildRecoveryKey, copyR2ObjectToRecovery } from "../services/documentRecovery.js";
import { generateAdmissionNumber, DocumentType, UserRole } from "@school-erp/shared";

interface MulterRequest extends Request { file?: Express.Multer.File; }
const RETENTION_MS = 60 * 24 * 60 * 60 * 1000;
const RASTER_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function prepareStudentDocument(file: Express.Multer.File): Promise<{ buffer: Buffer; contentType: string }> {
  if (!RASTER_IMAGE_TYPES.has(file.mimetype)) return { buffer: file.buffer, contentType: file.mimetype };
  const image = sharp(file.buffer).rotate();
  const resized = image.resize(1200, 1200, { fit: "inside", withoutEnlargement: true });
  if (file.mimetype === "image/png") return { buffer: await resized.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer(), contentType: "image/png" };
  if (file.mimetype === "image/webp") return { buffer: await resized.webp({ quality: 78 }).toBuffer(), contentType: "image/webp" };
  return { buffer: await resized.jpeg({ quality: 78, mozjpeg: true }).toBuffer(), contentType: "image/jpeg" };
}

function documentStorageKey(schoolId: string, studentId: string, type: string): string { return buildR2Key(["schools", schoolId, "students", studentId, "documents", type]); }

async function preserveDocumentVersion(schoolId: string, studentId: string, document: any, source: "r2-deletion" | "replacement" | "manual-archive") {
  const deletedAt = new Date();
  const recoveryKey = buildRecoveryKey(document.url, deletedAt);
  await copyR2ObjectToRecovery(document.url, recoveryKey);
  await DocumentRecovery.create({ schoolId, studentId, documentType: document.type, storageKey: document.url, recoveryKey, originalName: document.originalName, mimeType: document.mimeType, sizeBytes: document.sizeBytes, deletedAt, expiresAt: new Date(deletedAt.getTime() + RETENTION_MS), source, status: "available" });
}

async function getTeacherClassIds(req: Request): Promise<string[] | null> {
  if (req.user!.role !== UserRole.TEACHER) return null;
  const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: getTenantId(req) }).select("classTeacherOf").lean();
  return (teacher?.classTeacherOf ?? []).map((id) => id.toString());
}

async function assertStudentReadAccess(req: Request, studentId: string): Promise<void> {
  const schoolId = getTenantId(req);
  if (req.user!.role === UserRole.STUDENT) {
    const own = await Student.exists({ _id: studentId, schoolId, userId: req.user!.userId });
    if (!own) throw AppError.forbidden("Students can only access their own record");
    return;
  }
  if (req.user!.role === UserRole.PARENT) {
    const linkedChild = await Student.exists({ _id: studentId, schoolId, parentIds: req.user!.userId });
    if (!linkedChild) throw AppError.forbidden("Parents can only access their linked children");
    return;
  }
  if (req.user!.role === UserRole.TEACHER) {
    const student = await Student.findOne({ _id: studentId, schoolId }).select("classId").lean();
    if (!student) throw AppError.notFound("Student not found");
    const classIds = await getTeacherClassIds(req);
    if (!classIds?.includes(student.classId?.toString() ?? "")) throw AppError.forbidden("You are not assigned to this student's class");
  }
}

export async function getStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const query = req.validatedQuery as any;
    const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query;
    const dbQuery: any = { schoolId };
    if (req.user!.role === UserRole.STUDENT) {
      dbQuery.userId = req.user!.userId;
    } else if (req.user!.role === UserRole.PARENT) {
      dbQuery.parentIds = req.user!.userId;
    } else if (req.user!.role === UserRole.TEACHER) {
      const classIds = await getTeacherClassIds(req);
      if (!classIds?.length) {
        res.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
        return;
      }
      dbQuery.classId = { $in: classIds };
      if (filters.classId && !classIds.includes(String(filters.classId))) throw AppError.forbidden("You are not assigned to this class");
    }
    if (filters.classId && req.user!.role !== UserRole.TEACHER) dbQuery.classId = filters.classId;
    if (filters.sectionId) dbQuery.sectionId = filters.sectionId;
    if (filters.status) dbQuery.status = filters.status;
    if (filters.search && req.user!.role !== UserRole.STUDENT) {
      const search = escapeRegex(String(filters.search));
      dbQuery.$or = [{ firstName: { $regex: search, $options: "i" } }, { lastName: { $regex: search, $options: "i" } }, { admissionNo: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }];
    }
    const sort: any = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1; else sort.createdAt = -1;
    const skip = (page - 1) * limit;
    const [students, total] = await Promise.all([Student.find(dbQuery).select("-documents.url -documents.publicId").populate("classId sectionId").sort(sort).skip(skip).limit(limit).lean(), Student.countDocuments(dbQuery)]);
    res.json({ data: students, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function getStudentById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    await assertStudentReadAccess(req, id);
    const student = await Student.findOne({ _id: id, schoolId: getTenantId(req) }).select("-documents.url -documents.publicId").populate("classId sectionId userId");
    if (!student) throw AppError.notFound("Student not found");
    res.json({ student });
  } catch (error) { next(error); }
}

export async function getStudentDocumentUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, documentId } = req.validatedParams as any;
    await assertStudentReadAccess(req, id);
    const student = await Student.findOne({ _id: id, schoolId: getTenantId(req) }).select("documents");
    if (!student) throw AppError.notFound("Student not found");
    const document = student.documents.find((item: any) => item._id?.toString() === documentId);
    if (!document) throw AppError.notFound("Document not found");
    if (!document.url) throw AppError.notFound("Document storage key is missing");
    const signedUrl = await getR2SignedUrl(document.url, 600);
    res.json({ url: signedUrl, expiresIn: 600 });
  } catch (error) { next(error); }
}

export async function createStudent(req: Request, res: Response, next: NextFunction) { try { const data = withTenant(req, CreateStudentSchema.parse(req.body) as any); if (!data.admissionNo) data.admissionNo = generateAdmissionNumber(); const existing = await Student.findOne({ schoolId: data.schoolId, admissionNo: data.admissionNo }); if (existing) throw AppError.conflict("Admission number already exists"); const student = await Student.create(data); await createAuditLog({ userId: req.user!.userId, action: "CREATE", entity: "Student", entityId: student._id.toString(), after: { admissionNo: student.admissionNo, name: `${student.firstName} ${student.lastName}` } }); res.status(201).json({ student }); } catch (error) { next(error); } }
export async function updateStudent(req: Request, res: Response, next: NextFunction) { try { const { id } = req.validatedParams as any; const rawData = req.validatedBody as any; const { schoolId: _ignored, ...data } = rawData; const student = await Student.findOneAndUpdate({ _id: id, schoolId: getTenantId(req) }, data, { new: true }); if (!student) throw AppError.notFound("Student not found"); await createAuditLog({ userId: req.user!.userId, action: "UPDATE", entity: "Student", entityId: student._id.toString(), after: data }); res.json({ student }); } catch (error) { next(error); } }
export async function deleteStudent(req: Request, res: Response, next: NextFunction) { try { const { id } = req.validatedParams as any; const student = await Student.findOneAndUpdate({ _id: id, schoolId: getTenantId(req) }, { status: "left" }, { new: true }); if (!student) throw AppError.notFound("Student not found"); await createAuditLog({ userId: req.user!.userId, action: "DELETE", entity: "Student", entityId: student._id.toString() }); res.json({ message: "Student marked as left" }); } catch (error) { next(error); } }

export async function uploadStudentDocument(req: MulterRequest, res: Response, next: NextFunction) { try { const { id } = req.validatedParams as any; const schoolId = getTenantId(req); const type = String(req.body?.type || "").trim().toLowerCase(); if (!Object.values(DocumentType).includes(type as DocumentType)) throw AppError.badRequest("Invalid document type"); if (!req.file) throw AppError.badRequest("No file uploaded"); const student = await Student.findOne({ _id: id, schoolId }); if (!student) throw AppError.notFound("Student not found"); const prepared = await prepareStudentDocument(req.file); const key = documentStorageKey(schoolId, id, type); const existingDocument = student.documents.find((document: any) => document.type === type); if (existingDocument?.url) { try { await preserveDocumentVersion(schoolId, id, existingDocument, "replacement"); } catch (error) { console.error("[Recovery] Replacement snapshot failed; R2 was not overwritten", error); throw AppError.internal("Unable to preserve the previous document version. Please try again."); } } const result = await uploadToR2(prepared.buffer, key, prepared.contentType); const documentMetadata = { originalName: req.file.originalname, mimeType: prepared.contentType, sizeBytes: prepared.buffer.length, uploadedAt: new Date() }; if (existingDocument) Object.assign(existingDocument, { url: result.key, ...documentMetadata }); else student.documents.push({ _id: new mongoose.Types.ObjectId(), type: type as any, url: result.key, ...documentMetadata } as any); await student.save(); await createAuditLog({ userId: req.user!.userId, action: "UPLOAD_DOCUMENT", entity: "Student", entityId: student._id.toString(), after: { type, key: result.key, originalName: req.file.originalname, replaced: Boolean(existingDocument) } }); res.status(201).json({ document: student.documents.find((document: any) => document.type === type) }); } catch (error) { next(error); } }

export async function deleteStudentDocument(req: Request, res: Response, next: NextFunction) { try { const { id, documentId } = req.validatedParams as any; const schoolId = getTenantId(req); const student = await Student.findOne({ _id: id, schoolId }); if (!student) throw AppError.notFound("Student not found"); const index = student.documents.findIndex((item: any) => item._id?.toString() === documentId); if (index < 0) throw AppError.notFound("Document not found"); const document = student.documents[index]; if (document.url) { try { await preserveDocumentVersion(schoolId, id, document, "r2-deletion"); } catch (error) { console.error("[Recovery] Deletion snapshot failed; document was not deleted", error); throw AppError.internal("Unable to create a recovery copy. The document was not deleted."); } } const key = document.url; if (key) await deleteFromR2(key); student.documents.splice(index, 1); await student.save(); await createAuditLog({ userId: req.user!.userId, action: "DELETE_DOCUMENT", entity: "Student", entityId: student._id.toString(), after: { documentId, type: document.type, key } }); res.json({ message: "Document deleted" }); } catch (error) { next(error); } }
export async function getStudentDocumentRecoveryHistory(req: Request, res: Response, next: NextFunction) { try { const { id } = req.validatedParams as any; await assertStudentReadAccess(req, id); const schoolId = getTenantId(req); const documentType = String(req.query.type || "").trim().toLowerCase(); const filter: any = { schoolId, studentId: id, status: "available" }; if (documentType) filter.documentType = documentType; const recoveries = await DocumentRecovery.find(filter).sort({ deletedAt: -1 }).lean(); res.json({ data: recoveries }); } catch (error) { next(error); } }
export async function restoreStudentDocumentRecovery(req: Request, res: Response, next: NextFunction) { try { throw AppError.internal("Use the document recovery controller"); } catch (error) { next(error); } }
export async function bulkImportStudents(req: MulterRequest, res: Response, next: NextFunction) { try { const { parseExcelFile, validateRequiredFields } = await import("../services/excel.js"); if (!req.file) throw AppError.badRequest("No file uploaded"); const schoolId = getTenantId(req); const rows = await parseExcelFile(req.file.buffer); const { valid, errors } = validateRequiredFields(rows, ["firstName", "lastName", "dob", "gender", "fatherName", "motherName", "phone", "address", "admissionDate"]); const results = []; for (const row of valid) { try { const admissionNo = row.admissionNo || generateAdmissionNumber(); const student = await Student.create({ ...row, schoolId, admissionNo, dob: new Date(row.dob as string), admissionDate: new Date(row.admissionDate as string), gender: row.gender, bloodGroup: row.bloodGroup, documents: [] }); results.push({ success: true, admissionNo: student.admissionNo }); } catch (e) { results.push({ success: false, error: (e as Error).message }); } } res.json({ imported: results.filter((r) => r.success).length, errors: [...errors, ...results.filter((r) => !r.success)] }); } catch (error) { next(error); } }

export async function exportStudents(req: Request, res: Response, next: NextFunction) { try { const { generateExcelFile } = await import("../services/excel.js"); const schoolId = getTenantId(req); const query: any = { schoolId }; if (req.user!.role === UserRole.TEACHER) { const classIds = await getTeacherClassIds(req); if (!classIds?.length) { res.status(200).send(await generateExcelFile([], "Students")); return; } query.classId = { $in: classIds }; } const students = await Student.find(query).populate("classId sectionId").lean(); const data = students.map((s: any) => ({ admissionNo: s.admissionNo, firstName: s.firstName, lastName: s.lastName, class: (s.classId as any)?.displayName, section: (s.sectionId as any)?.name, gender: s.gender, phone: s.phone, status: s.status })); const buffer = await generateExcelFile(data, "Students"); res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); res.setHeader("Content-Disposition", "attachment; filename=students.xlsx"); res.send(buffer); } catch (error) { next(error); } }
