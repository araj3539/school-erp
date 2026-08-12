import { Request, Response, NextFunction } from "express";
import { Class, IClass, Section, ISection, Subject, ISubject, Teacher, ITeacher } from "../models";
import { CreateClassSchema, UpdateClassSchema, CreateSectionSchema, UpdateSectionSchema, CreateSubjectSchema, UpdateSubjectSchema, PaginationSchema, ObjectIdSchema } from "../validators";
import { createAuditLog } from "../services/auditLog";
import { AppError } from "../utils/errors";

export async function getClasses(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as any;
    const { page = 1, limit = 20, sortBy, sortOrder } = query;
    const sort: any = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    else sort.name = 1;
    const skip = (page - 1) * limit;
    const [classes, total] = await Promise.all([
      Class.find().populate("classTeacherId sectionIds").sort(sort).skip(skip).limit(limit).lean(),
      Class.countDocuments()
    ]);
    res.json({
      data: classes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

export async function getClassById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const cls = await Class.findById(id).populate("classTeacherId sectionIds");
    if (!cls) {
      throw AppError.notFound("Class not found");
    }
    res.json({ class: cls });
  } catch (error) {
    next(error);
  }
}

export async function createClass(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateClassSchema.parse(req.body);
    const existing = await Class.findOne({ name: data.name });
    if (existing) {
      throw AppError.conflict("Class name already exists");
    }
    const cls = await Class.create(data);
    await createAuditLog({
      userId: req.user!.userId,
      action: "CREATE",
      entity: "Class",
      entityId: cls._id.toString(),
      after: { name: cls.name, displayName: cls.displayName }
    });
    res.status(201).json({ class: cls });
  } catch (error) {
    next(error);
  }
}

export async function updateClass(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const data = req.validatedBody as any;
    const cls = await Class.findByIdAndUpdate(id, data, { new: true });
    if (!cls) {
      throw AppError.notFound("Class not found");
    }
    await createAuditLog({
      userId: req.user!.userId,
      action: "UPDATE",
      entity: "Class",
      entityId: cls._id.toString(),
      after: data
    });
    res.json({ class: cls });
  } catch (error) {
    next(error);
  }
}

export async function deleteClass(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const sections = await Section.countDocuments({ classId: id });
    if (sections > 0) {
      throw AppError.badRequest("Cannot delete class with sections");
    }
    await Class.findByIdAndDelete(id);
    await createAuditLog({
      userId: req.user!.userId,
      action: "DELETE",
      entity: "Class",
      entityId: id
    });
    res.json({ message: "Class deleted" });
  } catch (error) {
    next(error);
  }
}

export async function getSections(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId } = req.query;
    const dbQuery: any = {};
    if (classId) dbQuery.classId = classId;
    const sections = await Section.find(dbQuery).populate("classId").lean();
    res.json({ data: sections });
  } catch (error) {
    next(error);
  }
}

export async function createSection(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateSectionSchema.parse(req.body);
    const existing = await Section.findOne({ classId: data.classId, name: data.name });
    if (existing) {
      throw AppError.conflict("Section name already exists for this class");
    }
    const section = await Section.create(data);
    await Class.findByIdAndUpdate(data.classId, { $push: { sectionIds: section._id } });
    await createAuditLog({
      userId: req.user!.userId,
      action: "CREATE",
      entity: "Section",
      entityId: section._id.toString(),
      after: { name: section.name, classId: section.classId.toString() }
    });
    res.status(201).json({ section });
  } catch (error) {
    next(error);
  }
}

export async function updateSection(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const data = req.validatedBody as any;
    const section = await Section.findByIdAndUpdate(id, data, { new: true });
    if (!section) {
      throw AppError.notFound("Section not found");
    }
    await createAuditLog({
      userId: req.user!.userId,
      action: "UPDATE",
      entity: "Section",
      entityId: section._id.toString(),
      after: data
    });
    res.json({ section });
  } catch (error) {
    next(error);
  }
}

export async function deleteSection(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const section = await Section.findByIdAndDelete(id);
    if (!section) {
      throw AppError.notFound("Section not found");
    }
    await Class.findByIdAndUpdate(section.classId, { $pull: { sectionIds: id } });
    await createAuditLog({
      userId: req.user!.userId,
      action: "DELETE",
      entity: "Section",
      entityId: id
    });
    res.json({ message: "Section deleted" });
  } catch (error) {
    next(error);
  }
}

export async function getSubjects(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId } = req.query;
    const dbQuery: any = {};
    if (classId) dbQuery.classIds = classId;
    const subjects = await Subject.find(dbQuery).populate("classIds teacherId").lean();
    res.json({ data: subjects });
  } catch (error) {
    next(error);
  }
}

export async function createSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateSubjectSchema.parse(req.body);
    const existing = await Subject.findOne({ code: data.code });
    if (existing) {
      throw AppError.conflict("Subject code already exists");
    }
    const subject = await Subject.create(data);
    await createAuditLog({
      userId: req.user!.userId,
      action: "CREATE",
      entity: "Subject",
      entityId: subject._id.toString(),
      after: { name: subject.name, code: subject.code }
    });
    res.status(201).json({ subject });
  } catch (error) {
    next(error);
  }
}

export async function updateSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const data = req.validatedBody as any;
    const subject = await Subject.findByIdAndUpdate(id, data, { new: true });
    if (!subject) {
      throw AppError.notFound("Subject not found");
    }
    await createAuditLog({
      userId: req.user!.userId,
      action: "UPDATE",
      entity: "Subject",
      entityId: subject._id.toString(),
      after: data
    });
    res.json({ subject });
  } catch (error) {
    next(error);
  }
}

export async function deleteSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    await Subject.findByIdAndDelete(id);
    await createAuditLog({
      userId: req.user!.userId,
      action: "DELETE",
      entity: "Subject",
      entityId: id
    });
    res.json({ message: "Subject deleted" });
  } catch (error) {
    next(error);
  }
}