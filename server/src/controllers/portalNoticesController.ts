import { Request, Response, NextFunction } from "express";
import { Notice, Student, Teacher } from "../models/index.js";
import { UserRole } from "@school-erp/shared";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";

const activeWindow = () => ({ publishAt: { $lte: new Date() }, $and: [{ $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] }] });

function formatNotice(notice: any) {
  return {
    _id: notice._id,
    title: notice.title,
    content: notice.content,
    priority: notice.priority,
    publishAt: notice.publishAt,
    expiresAt: notice.expiresAt || null,
    audience: notice.audience,
    class: notice.classId?.displayName || "",
    section: notice.sectionId?.name || "",
  };
}

function formatStudent(student: any) {
  return { _id: student._id, firstName: student.firstName, lastName: student.lastName, class: student.classId?.displayName || "", section: student.sectionId?.name || "" };
}

export async function getPortalNotices(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const base: any = { schoolId, ...activeWindow() };
    let students: any[] = [];
    let selectedStudentId: any = null;
    const targets: any[] = [{ audience: "school" }];

    if (req.user!.role === UserRole.STUDENT) {
      const student: any = await Student.findOne({ schoolId, userId: req.user!.userId, status: "active" }).select("_id firstName lastName classId sectionId").populate("classId sectionId").lean();
      if (!student) throw AppError.notFound("Student record not found");
      students = [student]; selectedStudentId = student._id;
      targets.push({ audience: "class", classId: student.classId });
      if (student.sectionId) targets.push({ audience: "section", classId: student.classId, sectionId: student.sectionId });
    } else if (req.user!.role === UserRole.PARENT) {
      const childId = String(req.query.childId || "").trim();
      const linked = await Student.find({ schoolId, parentIds: req.user!.userId, status: "active" }).select("_id firstName lastName classId sectionId").populate("classId sectionId").sort({ firstName: 1, lastName: 1 }).lean();
      if (!linked.length) throw AppError.notFound("No linked children found");
      students = childId ? linked.filter((student: any) => student._id.toString() === childId) : linked;
      if (!students.length) throw AppError.notFound("Child not found");
      selectedStudentId = students.length === 1 ? students[0]._id : null;
      for (const student of students as any[]) {
        targets.push({ audience: "class", classId: student.classId });
        if (student.sectionId) targets.push({ audience: "section", classId: student.classId, sectionId: student.sectionId });
      }
    } else if (req.user!.role === UserRole.TEACHER) {
      const teacher: any = await Teacher.findOne({ schoolId, userId: req.user!.userId, status: "active" }).select("classTeacherOf").lean();
      if (!teacher) throw AppError.notFound("Teacher record not found");
      if (teacher.classTeacherOf?.length) {
        targets.push({ audience: "class", classId: { $in: teacher.classTeacherOf } });
        targets.push({ audience: "section", classId: { $in: teacher.classTeacherOf } });
      }
    } else {
      throw AppError.forbidden("Portal notices are not available for this role");
    }

    const q: any = req.validatedQuery || {};
    const filter: any = { ...base, $and: [...base.$and, { $or: targets }] };
    if (q.priority) filter.priority = q.priority;
    const page = Math.max(1, Number(q.page || 1));
    const limit = Math.min(50, Math.max(1, Number(q.limit || 20)));
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Notice.find(filter).select("title content priority publishAt expiresAt audience classId sectionId").populate("classId sectionId").sort({ priority: -1, publishAt: -1 }).skip(skip).limit(limit).lean(),
      Notice.countDocuments(filter),
    ]);
    res.json({ students: students.map(formatStudent), selectedStudentId, data: data.map(formatNotice), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}
