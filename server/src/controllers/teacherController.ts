import { Request, Response, NextFunction } from "express";
import { Teacher, ITeacher, Subject, ISubject, Class, IClass } from "../models/index.js";
import { CreateTeacherSchema, UpdateTeacherSchema, PaginationSchema, ObjectIdSchema } from "../validators/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { generateEmployeeId } from "@school-erp/shared";

export async function getTeachers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as any;
    const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query;
    const dbQuery: any = {};
    if (filters.status) dbQuery.status = filters.status;
    if (filters.search) {
      dbQuery.$or = [
        { firstName: { $regex: filters.search, $options: "i" } },
        { lastName: { $regex: filters.search, $options: "i" } },
        { employeeId: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } }
      ];
    }
    const sort: any = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    else sort.createdAt = -1;
    const skip = (page - 1) * limit;
    const [teachers, total] = await Promise.all([
      Teacher.find(dbQuery).populate("subjects classTeacherOf").sort(sort).skip(skip).limit(limit).lean(),
      Teacher.countDocuments(dbQuery)
    ]);
    res.json({
      data: teachers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

export async function getTeacherById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const teacher = await Teacher.findById(id).populate("subjects classTeacherOf userId");
    if (!teacher) {
      throw AppError.notFound("Teacher not found");
    }
    res.json({ teacher });
  } catch (error) {
    next(error);
  }
}

export async function createTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateTeacherSchema.parse(req.body);
    if (!data.employeeId) {
      data.employeeId = generateEmployeeId();
    }
    const existing = await Teacher.findOne({ employeeId: data.employeeId });
    if (existing) {
      throw AppError.conflict("Employee ID already exists");
    }
    const existingEmail = await Teacher.findOne({ email: data.email });
    if (existingEmail) {
      throw AppError.conflict("Email already registered");
    }
    const teacher = await Teacher.create(data);
    await createAuditLog({
      userId: req.user!.userId,
      action: "CREATE",
      entity: "Teacher",
      entityId: teacher._id.toString(),
      after: { employeeId: teacher.employeeId, name: `${teacher.firstName} ${teacher.lastName}` }
    });
    res.status(201).json({ teacher });
  } catch (error) {
    next(error);
  }
}

export async function updateTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const data = req.validatedBody as any;
    const teacher = await Teacher.findByIdAndUpdate(id, data, { new: true });
    if (!teacher) {
      throw AppError.notFound("Teacher not found");
    }
    await createAuditLog({
      userId: req.user!.userId,
      action: "UPDATE",
      entity: "Teacher",
      entityId: teacher._id.toString(),
      after: data
    });
    res.json({ teacher });
  } catch (error) {
    next(error);
  }
}

export async function deleteTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const teacher = await Teacher.findByIdAndUpdate(id, { status: "inactive" }, { new: true });
    if (!teacher) {
      throw AppError.notFound("Teacher not found");
    }
    await createAuditLog({
      userId: req.user!.userId,
      action: "DELETE",
      entity: "Teacher",
      entityId: teacher._id.toString()
    });
    res.json({ message: "Teacher deactivated" });
  } catch (error) {
    next(error);
  }
}