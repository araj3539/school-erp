import { Request, Response, NextFunction } from "express";
import { Exam, Teacher } from "../models/index.js";
import { UserRole } from "@school-erp/shared";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";

export async function getTeacherMarksExams(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user!.role !== UserRole.TEACHER) throw AppError.forbidden("Teacher marks are not available for this role");
    const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: getTenantId(req), status: "active" }).select("subjects classTeacherOf").lean();
    if (!teacher) throw AppError.forbidden("Teacher profile not found");
    const classIds = (teacher.classTeacherOf ?? []).map((id: any) => id.toString());
    const subjectIds = (teacher.subjects ?? []).map((id: any) => id.toString());
    const scope: Record<string, unknown>[] = [];
    if (classIds.length) scope.push({ classId: { $in: classIds } });
    if (subjectIds.length) scope.push({ "subjects.subjectId": { $in: subjectIds } });
    if (!scope.length) return res.json({ data: [] });

    const filter: Record<string, unknown> = { schoolId: getTenantId(req), $or: scope };
    if (typeof req.query.classId === "string" && req.query.classId) filter.classId = req.query.classId;
    const data = await Exam.find(filter).populate("classId subjects.subjectId").sort({ startDate: -1, createdAt: -1 }).limit(50).lean();
    return res.json({ data });
  } catch (error) {
    next(error);
  }
}
