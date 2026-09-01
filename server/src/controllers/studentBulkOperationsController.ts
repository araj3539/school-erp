import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Student, Teacher } from "../models/index.js";
import { CreateStudentSchema } from "../validators/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { escapeRegex } from "../utils/strings.js";
import { generateAdmissionNumber, UserRole } from "@school-erp/shared";
import { generateExcelFile, parseExcelFile } from "../services/excel.js";

interface MulterRequest extends Request { file?: Express.Multer.File; }

function normalizeDateOnly(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value ?? "").trim();
  return text.includes("T") ? text.slice(0, 10) : text;
}

function formatValidationError(error: any): string {
  if (error?.issues?.length) {
    return error.issues.map((issue: any) => `${issue.path?.join(".") || "row"}: ${issue.message}`).join("; ");
  }
  return error instanceof Error ? error.message : "Invalid student data";
}

async function getTeacherClassIds(req: Request): Promise<string[] | null> {
  if (req.user!.role !== UserRole.TEACHER) return null;
  const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: getTenantId(req) }).select("classTeacherOf").lean();
  return (teacher?.classTeacherOf ?? []).map((id) => id.toString());
}

export async function bulkImportStudentsHardened(req: MulterRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw AppError.badRequest("No file uploaded", "FILE_REQUIRED");
    const schoolId = getTenantId(req);
    const rows = await parseExcelFile(req.file.buffer);
    if (rows.length === 0) throw AppError.badRequest("Excel file contains no data rows", "EMPTY_IMPORT");

    const validationErrors: { row: number; message: string }[] = [];
    const documents: any[] = [];
    const admissionNumbers: string[] = [];
    const seenAdmissionNumbers = new Set<string>();

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      const admissionNo = String(row.admissionNo ?? "").trim() || generateAdmissionNumber();
      if (seenAdmissionNumbers.has(admissionNo)) {
        validationErrors.push({ row: rowNumber, message: `Duplicate admissionNo in import: ${admissionNo}` });
        continue;
      }
      seenAdmissionNumbers.add(admissionNo);
      admissionNumbers.push(admissionNo);
      try {
        const parsed = CreateStudentSchema.parse({
          ...row,
          admissionNo,
          schoolId,
          dob: normalizeDateOnly(row.dob),
          admissionDate: normalizeDateOnly(row.admissionDate),
        });
        documents.push({ ...parsed, schoolId, documents: [] });
      } catch (error) {
        validationErrors.push({ row: rowNumber, message: formatValidationError(error) });
      }
    }

    const existing = await Student.find({ admissionNo: { $in: admissionNumbers }, schoolId }).select("admissionNo").lean();
    if (existing.length) {
      const existingSet = new Set(existing.map((student) => student.admissionNo));
      admissionNumbers.forEach((admissionNo, index) => {
        if (existingSet.has(admissionNo)) validationErrors.push({ row: index + 2, message: `Admission number already exists: ${admissionNo}` });
      });
    }

    if (validationErrors.length) {
      return res.status(400).json({ error: "Student import validation failed", code: "VALIDATION_ERROR", errors: validationErrors });
    }

    const session = await mongoose.startSession();
    let created: any[] = [];
    try {
      await session.withTransaction(async () => {
        const docs = documents.map((doc) => new Student(doc));
        for (const student of docs) await student.validate();
        created = await Student.create(documents, { session });
        for (const student of created) {
          await createAuditLog({
            userId: req.user!.userId,
            schoolId,
            action: "CREATE",
            entity: "Student",
            entityId: student._id.toString(),
            after: { admissionNo: student.admissionNo, name: `${student.firstName} ${student.lastName}`, source: "bulk-import" },
            session,
          });
        }
      });
    } finally {
      await session.endSession();
    }

    return res.status(200).json({ imported: created.length, errors: [] });
  } catch (error) {
    next(error);
  }
}

async function applyStudentExportFilters(query: any, input: any): Promise<void> {
  const { search, status, classId, sectionId } = input;
  if (classId) query.classId = classId;
  if (sectionId) query.sectionId = sectionId;
  if (status) query.status = status;

  const searchText = String(search ?? "").trim();
  if (!searchText) return;

  const escaped = escapeRegex(searchText);
  query.$or = [
    { firstName: { $regex: escaped, $options: "i" } },
    { lastName: { $regex: escaped, $options: "i" } },
    { admissionNo: { $regex: escaped, $options: "i" } },
    { phone: { $regex: escaped, $options: "i" } },
  ];
}

export async function exportStudentsHardened(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const queryInput = req.validatedQuery as any;
    const { page, limit, sortBy, sortOrder } = queryInput;
    const query: any = { schoolId };

    if (req.user!.role === UserRole.TEACHER) {
      const classIds = await getTeacherClassIds(req);
      if (!classIds?.length) return sendStudentWorkbook(res, []);
      query.classId = { $in: classIds };
      if (queryInput.classId && !classIds.includes(String(queryInput.classId))) {
        throw AppError.forbidden("You are not assigned to this class");
      }
    }

    await applyStudentExportFilters(query, queryInput);

    const sort: any = sortBy ? { [sortBy]: sortOrder === "asc" ? 1 : -1 } : { createdAt: -1 };
    const skip = page && limit ? (page - 1) * limit : 0;
    const studentsQuery = Student.find(query).populate("classId sectionId").sort(sort);
    if (limit) studentsQuery.skip(skip).limit(limit);
    const students = await studentsQuery.lean();
    return sendStudentWorkbook(res, students);
  } catch (error) {
    next(error);
  }
}

async function sendStudentWorkbook(res: Response, students: any[]): Promise<void> {
  const data = students.map((student: any) => ({
    admissionNo: student.admissionNo,
    firstName: student.firstName,
    lastName: student.lastName,
    class: student.classId?.displayName ?? "",
    section: student.sectionId?.name ?? "",
    gender: student.gender,
    phone: student.phone,
    status: student.status,
  }));

  const workbookData = data.length > 0 ? data : [{ admissionNo: "", firstName: "", lastName: "", class: "", section: "", gender: "", phone: "", status: "" }];
  const buffer = await generateExcelFile(workbookData, "Students");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=students.xlsx");
  res.send(buffer);
}
