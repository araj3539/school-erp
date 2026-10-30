import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
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
    const requestedClassId = typeof req.query.classId === "string" ? req.query.classId.trim() : "";
    if (requestedClassId) {
      if (!isValidObjectId(requestedClassId)) throw AppError.badRequest("Invalid class id");
      filter.classId = requestedClassId;
    }
    const candidates = await Exam.find(filter).populate("classId subjects.subjectId").sort({ startDate: -1, createdAt: -1 }).limit(50).lean();
    const assignedSubjectIds = new Set(subjectIds);
    const classTeacherOf = new Set(classIds);
    // Keep exams the teacher can actually enter marks for: class-teacher of the
    // exam's class, OR assigned every subject on it (matches assertTeacherCanMark).
    const data = candidates.filter((exam: any) => {
      const examClassId = (exam.classId?._id ?? exam.classId)?.toString();
      const everySubjectAssigned = (exam.subjects ?? []).every((item: any) => assignedSubjectIds.has((item.subjectId?._id ?? item.subjectId).toString()));
      return Boolean(examClassId && classTeacherOf.has(examClassId)) || everySubjectAssigned;
    });
    return res.json({ data });
  } catch (error) {
    next(error);
  }
}
