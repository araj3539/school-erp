import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { Student, IStudent, Class, IClass, Section, ISection, User, IUser } from "../models/index.js";
import { CreateStudentSchema, UpdateStudentSchema, PaginationSchema, ObjectIdSchema } from "../validators/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { getTenantId, withTenant } from "../utils/tenant.js";
import { generateAdmissionNumber } from "@school-erp/shared";
import { uploadImage } from "../services/cloudinary.js";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export async function getStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const query = req.validatedQuery as any;
    const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query;
    const dbQuery: any = { schoolId };
    if (filters.classId) dbQuery.classId = filters.classId;
    if (filters.sectionId) dbQuery.sectionId = filters.sectionId;
    if (filters.status) dbQuery.status = filters.status;
    if (filters.search) {
      dbQuery.$or = [
        { firstName: { $regex: filters.search, $options: "i" } },
        { lastName: { $regex: filters.search, $options: "i" } },
        { admissionNo: { $regex: filters.search, $options: "i" } },
        { phone: { $regex: filters.search, $options: "i" } }
      ];
    }
    const sort: any = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    else sort.createdAt = -1;
    const skip = (page - 1) * limit;
    const [students, total] = await Promise.all([
      Student.find(dbQuery).populate("classId sectionId").sort(sort).skip(skip).limit(limit).lean(),
      Student.countDocuments(dbQuery)
    ]);
    res.json({
      data: students,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudentById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const student = await Student.findOne({ _id: id, schoolId: getTenantId(req) }).populate("classId sectionId userId");
    if (!student) {
      throw AppError.notFound("Student not found");
    }
    res.json({ student });
  } catch (error) {
    next(error);
  }
}

export async function createStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = withTenant(req, CreateStudentSchema.parse(req.body) as any);
    if (!data.admissionNo) {
      data.admissionNo = generateAdmissionNumber();
    }
    const existing = await Student.findOne({ schoolId: data.schoolId, admissionNo: data.admissionNo });
    if (existing) {
      throw AppError.conflict("Admission number already exists");
    }
    const student = await Student.create(data);
    await createAuditLog({
      userId: req.user!.userId,
      action: "CREATE",
      entity: "Student",
      entityId: student._id.toString(),
      after: { admissionNo: student.admissionNo, name: `${student.firstName} ${student.lastName}` }
    });
    res.status(201).json({ student });
  } catch (error) {
    next(error);
  }
}

export async function updateStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const rawData = req.validatedBody as any;
    const { schoolId: _ignored, ...data } = rawData;
    const student = await Student.findOneAndUpdate({ _id: id, schoolId: getTenantId(req) }, data, { new: true });
    if (!student) {
      throw AppError.notFound("Student not found");
    }
    await createAuditLog({
      userId: req.user!.userId,
      action: "UPDATE",
      entity: "Student",
      entityId: student._id.toString(),
      after: data
    });
    res.json({ student });
  } catch (error) {
    next(error);
  }
}

export async function deleteStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const student = await Student.findOneAndUpdate({ _id: id, schoolId: getTenantId(req) }, { status: "left" }, { new: true });
    if (!student) {
      throw AppError.notFound("Student not found");
    }
    await createAuditLog({
      userId: req.user!.userId,
      action: "DELETE",
      entity: "Student",
      entityId: student._id.toString()
    });
    res.json({ message: "Student marked as left" });
  } catch (error) {
    next(error);
  }
}

export async function uploadStudentDocument(req: MulterRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const { type } = req.validatedBody as any;
    if (!req.file) {
      throw AppError.badRequest("No file uploaded");
    }
    const student = await Student.findOne({ _id: id, schoolId: getTenantId(req) });
    if (!student) {
      throw AppError.notFound("Student not found");
    }
    const result = await uploadImage(req.file.buffer, "student", id, type);
    student.documents.push({
      type: type as any,
      url: result.url,
      uploadedAt: new Date()
    });
    await student.save();
    await createAuditLog({
      userId: req.user!.userId,
      action: "UPLOAD_DOCUMENT",
      entity: "Student",
      entityId: student._id.toString(),
      after: { type, url: result.url }
    });
    res.json({ document: student.documents[student.documents.length - 1] });
  } catch (error) {
    next(error);
  }
}

export async function bulkImportStudents(req: MulterRequest, res: Response, next: NextFunction) {
  try {
    const { parseExcelFile, validateRequiredFields } = await import("../services/excel.js");
    if (!req.file) {
      throw AppError.badRequest("No file uploaded");
    }
    const schoolId = getTenantId(req);
    const rows = parseExcelFile(req.file.buffer);
    const { valid, errors } = validateRequiredFields(rows, [
      "firstName", "lastName", "dob", "gender", "fatherName",
      "motherName", "phone", "address", "admissionDate"
    ]);
    const results = [];
    for (const row of valid) {
      try {
        const admissionNo = row.admissionNo || generateAdmissionNumber();
        const student = await Student.create({
          ...row,
          schoolId,
          admissionNo,
          dob: new Date(row.dob as string),
          admissionDate: new Date(row.admissionDate as string),
          gender: row.gender,
          bloodGroup: row.bloodGroup,
          documents: []
        });
        results.push({ success: true, admissionNo: student.admissionNo });
      } catch (e) {
        results.push({ success: false, error: (e as Error).message });
      }
    }
    res.json({ imported: results.filter((r) => r.success).length, errors: [...errors, ...results.filter((r) => !r.success)] });
  } catch (error) {
    next(error);
  }
}

export async function exportStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const { generateExcelFile } = await import("../services/excel.js");
    const students = await Student.find({ schoolId: getTenantId(req) }).populate("classId sectionId").lean();
    const data = students.map((s: any) => ({
      admissionNo: s.admissionNo,
      firstName: s.firstName,
      lastName: s.lastName,
      class: (s.classId as any)?.displayName,
      section: (s.sectionId as any)?.name,
      gender: s.gender,
      phone: s.phone,
      status: s.status
    }));
    const buffer = generateExcelFile(data, "Students");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=students.xlsx");
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}