import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { Student, IStudent, Class, IClass, Section, ISection, User, IUser } from "../models";
import { CreateStudentSchema, UpdateStudentSchema, PaginationSchema, ObjectIdSchema } from "../validators";
import { createAuditLog } from "../services/auditLog";
import { AppError } from "../utils/errors";
import { generateAdmissionNumber } from "@school-erp/shared";
import { uploadImage } from "../services/cloudinary";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export async function getStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as any;
    const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query;
    const dbQuery: any = {};
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
    const student = await Student.findById(id).populate("classId sectionId userId");
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
    const data = CreateStudentSchema.parse(req.body);
    if (!data.admissionNo) {
      data.admissionNo = generateAdmissionNumber();
    }
    const existing = await Student.findOne({ admissionNo: data.admissionNo });
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
    const data = req.validatedBody as any;
    const student = await Student.findByIdAndUpdate(id, data, { new: true });
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
    const student = await Student.findByIdAndUpdate(id, { status: "left" }, { new: true });
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
    const student = await Student.findById(id);
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
    const students = await Student.find().populate("classId sectionId").lean();
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