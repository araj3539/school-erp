import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import sharp from "sharp";
import { Student } from "../models/index.js";
import { CreateStudentSchema } from "../validators/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { getTenantId, withTenant } from "../utils/tenant.js";
import { escapeRegex } from "../utils/strings.js";
import { buildR2Key, sanitizeFileName, uploadToR2, getR2SignedUrl } from "../services/r2.js";
import { generateAdmissionNumber, DocumentType } from "@school-erp/shared";

interface MulterRequest extends Request { file?: Express.Multer.File; }
const RASTER_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function prepareStudentDocument(file: Express.Multer.File): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  if (!RASTER_IMAGE_TYPES.has(file.mimetype)) return { buffer: file.buffer, contentType: file.mimetype, extension: file.originalname.includes(".") ? `.${file.originalname.split(".").pop()}` : "" };
  const image = sharp(file.buffer).rotate();
  const resized = image.resize(1200, 1200, { fit: "inside", withoutEnlargement: true });
  if (file.mimetype === "image/png") return { buffer: await resized.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer(), contentType: "image/png", extension: ".png" };
  if (file.mimetype === "image/webp") return { buffer: await resized.webp({ quality: 78 }).toBuffer(), contentType: "image/webp", extension: ".webp" };
  return { buffer: await resized.jpeg({ quality: 78, mozjpeg: true }).toBuffer(), contentType: "image/jpeg", extension: ".jpg" };
}

export async function getStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req); const query = req.validatedQuery as any; const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query; const dbQuery: any = { schoolId };
    if (filters.classId) dbQuery.classId = filters.classId; if (filters.sectionId) dbQuery.sectionId = filters.sectionId; if (filters.status) dbQuery.status = filters.status;
    if (filters.search) { const search = escapeRegex(String(filters.search)); dbQuery.$or = [{ firstName: { $regex: search, $options: "i" } }, { lastName: { $regex: search, $options: "i" } }, { admissionNo: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }]; }
    const sort: any = {}; if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1; else sort.createdAt = -1; const skip = (page - 1) * limit;
    const [students, total] = await Promise.all([Student.find(dbQuery).populate("classId sectionId").sort(sort).skip(skip).limit(limit).lean(), Student.countDocuments(dbQuery)]);
    res.json({ data: students, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function getStudentById(req: Request, res: Response, next: NextFunction) {
  try { const { id } = req.validatedParams as any; const student = await Student.findOne({ _id: id, schoolId: getTenantId(req) }).populate("classId sectionId userId"); if (!student) throw AppError.notFound("Student not found"); res.json({ student }); } catch (error) { next(error); }
}

export async function getStudentDocumentUrl(req: Request, res: Response, next: NextFunction) {
  try { const { id, documentId } = req.validatedParams as any; const student = await Student.findOne({ _id: id, schoolId: getTenantId(req) }).select("documents"); if (!student) throw AppError.notFound("Student not found"); const document = student.documents.find((item: any) => item._id?.toString() === documentId); if (!document) throw AppError.notFound("Document not found"); if (!document.url) throw AppError.notFound("Document storage key is missing"); const signedUrl = await getR2SignedUrl(document.url, 600); res.json({ url: signedUrl, expiresIn: 600 }); } catch (error) { next(error); }
}

export async function createStudent(req: Request, res: Response, next: NextFunction) {
  try { const data = withTenant(req, CreateStudentSchema.parse(req.body) as any); if (!data.admissionNo) data.admissionNo = generateAdmissionNumber(); const existing = await Student.findOne({ schoolId: data.schoolId, admissionNo: data.admissionNo }); if (existing) throw AppError.conflict("Admission number already exists"); const student = await Student.create(data); await createAuditLog({ userId: req.user!.userId, action: "CREATE", entity: "Student", entityId: student._id.toString(), after: { admissionNo: student.admissionNo, name: `${student.firstName} ${student.lastName}` } }); res.status(201).json({ student }); } catch (error) { next(error); }
}

export async function updateStudent(req: Request, res: Response, next: NextFunction) {
  try { const { id } = req.validatedParams as any; const rawData = req.validatedBody as any; const { schoolId: _ignored, ...data } = rawData; const student = await Student.findOneAndUpdate({ _id: id, schoolId: getTenantId(req) }, data, { new: true }); if (!student) throw AppError.notFound("Student not found"); await createAuditLog({ userId: req.user!.userId, action: "UPDATE", entity: "Student", entityId: student._id.toString(), after: data }); res.json({ student }); } catch (error) { next(error); }
}

export async function deleteStudent(req: Request, res: Response, next: NextFunction) {
  try { const { id } = req.validatedParams as any; const student = await Student.findOneAndUpdate({ _id: id, schoolId: getTenantId(req) }, { status: "left" }, { new: true }); if (!student) throw AppError.notFound("Student not found"); await createAuditLog({ userId: req.user!.userId, action: "DELETE", entity: "Student", entityId: student._id.toString() }); res.json({ message: "Student marked as left" }); } catch (error) { next(error); }
}

export async function uploadStudentDocument(req: MulterRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const type = String(req.body?.type || "").trim().toLowerCase();
    if (!Object.values(DocumentType).includes(type as DocumentType)) throw AppError.badRequest("Invalid document type");
    if (!req.file) throw AppError.badRequest("No file uploaded");
    const student = await Student.findOne({ _id: id, schoolId: getTenantId(req) });
    if (!student) throw AppError.notFound("Student not found");
    const prepared = await prepareStudentDocument(req.file);
    const safeOriginalName = sanitizeFileName(req.file.originalname).replace(/\.[^.]+$/, "");
    const fileName = `${safeOriginalName}${prepared.extension}`;
    const documentId = new mongoose.Types.ObjectId().toString();
    const key = buildR2Key(["students", id, "documents", `${documentId}_${fileName}`]);
    const result = await uploadToR2(prepared.buffer, key, prepared.contentType);
    student.documents.push({ type: type as any, url: result.key, uploadedAt: new Date() });
    await student.save();
    await createAuditLog({ userId: req.user!.userId, action: "UPLOAD_DOCUMENT", entity: "Student", entityId: student._id.toString(), after: { type, key: result.key, originalName: req.file.originalname, mimeType: prepared.contentType, sizeBytes: prepared.buffer.length } });
    res.status(201).json({ document: student.documents[student.documents.length - 1] });
  } catch (error) { next(error); }
}

export async function bulkImportStudents(req: MulterRequest, res: Response, next: NextFunction) {
  try { const { parseExcelFile, validateRequiredFields } = await import("../services/excel.js"); if (!req.file) throw AppError.badRequest("No file uploaded"); const schoolId = getTenantId(req); const rows = await parseExcelFile(req.file.buffer); const { valid, errors } = validateRequiredFields(rows, ["firstName", "lastName", "dob", "gender", "fatherName", "motherName", "phone", "address", "admissionDate"]); const results = []; for (const row of valid) { try { const admissionNo = row.admissionNo || generateAdmissionNumber(); const student = await Student.create({ ...row, schoolId, admissionNo, dob: new Date(row.dob as string), admissionDate: new Date(row.admissionDate as string), gender: row.gender, bloodGroup: row.bloodGroup, documents: [] }); results.push({ success: true, admissionNo: student.admissionNo }); } catch (e) { results.push({ success: false, error: (e as Error).message }); } } res.json({ imported: results.filter((r) => r.success).length, errors: [...errors, ...results.filter((r) => !r.success)] }); } catch (error) { next(error); }
}

export async function exportStudents(req: Request, res: Response, next: NextFunction) {
  try { const { generateExcelFile } = await import("../services/excel.js"); const students = await Student.find({ schoolId: getTenantId(req) }).populate("classId sectionId").lean(); const data = students.map((s: any) => ({ admissionNo: s.admissionNo, firstName: s.firstName, lastName: s.lastName, class: (s.classId as any)?.displayName, section: (s.sectionId as any)?.name, gender: s.gender, phone: s.phone, status: s.status })); const buffer = await generateExcelFile(data, "Students"); res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); res.setHeader("Content-Disposition", "attachment; filename=students.xlsx"); res.send(buffer); } catch (error) { next(error); }
}
