import { Request, Response, NextFunction } from "express";
import { AcademicYear, Class, Homework, Section, Subject, Teacher } from "../models/index.js";
import { UserRole } from "@school-erp/shared";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";

function publicHomework(homework: any) {
  return {
    ...homework,
    attachments: (homework.attachments ?? []).map((item: any) => ({
      _id: item._id,
      name: item.name,
      size: item.size,
      mimeType: item.mimeType,
      uploadedAt: item.uploadedAt,
    })),
  };
}

async function getTeacher(req: Request) {
  if (req.user!.role !== UserRole.TEACHER) throw AppError.forbidden("Teacher homework is not available for this role");
  const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: getTenantId(req), status: "active" })
    .select("_id firstName lastName subjects classTeacherOf")
    .lean();
  if (!teacher) throw AppError.forbidden("Teacher profile not found");
  return teacher;
}

export async function getTeacherHomeworkOptions(req: Request, res: Response, next: NextFunction) {
  try {
    const teacher = await getTeacher(req);
    const schoolId = getTenantId(req);
    const academicYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).select("_id name startDate endDate").lean();
    if (!academicYear) throw AppError.badRequest("No current academic year set");

    const subjects = teacher.subjects?.length
      ? await Subject.find({ _id: { $in: teacher.subjects }, schoolId }).select("_id name code classIds").sort({ name: 1 }).lean()
      : [];
    const subjectClassIds = subjects.flatMap((subject: any) => subject.classIds ?? []).map((id: any) => id.toString());
    const allowedClassIds = [...new Set([...(teacher.classTeacherOf ?? []).map((id: any) => id.toString()), ...subjectClassIds])];
    const classes = allowedClassIds.length
      ? await Class.find({ _id: { $in: allowedClassIds }, schoolId }).select("_id name displayName sectionIds").sort({ name: 1 }).lean()
      : [];
    const sectionIds = classes.flatMap((item: any) => item.sectionIds ?? []);
    const sections = sectionIds.length
      ? await Section.find({ _id: { $in: sectionIds }, schoolId }).select("_id name classId").sort({ classId: 1, name: 1 }).lean()
      : [];

    return res.json({ academicYear, teacher: { _id: teacher._id, firstName: teacher.firstName, lastName: teacher.lastName }, classes, sections, subjects });
  } catch (error) {
    next(error);
  }
}

export async function getTeacherHomework(req: Request, res: Response, next: NextFunction) {
  try {
    const teacher = await getTeacher(req);
    const schoolId = getTenantId(req);
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
    const academicYear = typeof req.query.academicYearId === "string" ? req.query.academicYearId : undefined;
    const classId = typeof req.query.classId === "string" ? req.query.classId : undefined;
    const sectionId = typeof req.query.sectionId === "string" ? req.query.sectionId : undefined;
    const subjectId = typeof req.query.subjectId === "string" ? req.query.subjectId : undefined;

    const filter: any = { schoolId };
    if (academicYear) filter.academicYearId = academicYear;
    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;
    if (subjectId) filter.subjectId = subjectId;

    const scope = [
      ...(teacher.classTeacherOf ?? []).map((id: any) => ({ classId: id })),
      ...(teacher.subjects ?? []).map((id: any) => ({ subjectId: id })),
    ];
    if (!scope.length) return res.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    filter.$or = scope;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Homework.find(filter).populate("classId sectionId subjectId academicYearId createdBy").sort({ dueDate: 1, assignedDate: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Homework.countDocuments(filter),
    ]);
    return res.json({ data: data.map(publicHomework), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
}
