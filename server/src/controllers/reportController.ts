import { Request, Response, NextFunction } from "express";
import { Attendance, Fee, Student } from "../models/index.js";
import { getTenantId } from "../utils/tenant.js";
import { escapeRegex } from "../utils/strings.js";

function pagination(query: any) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  return { page, limit, skip: (page - 1) * limit };
}

export async function getStudentReport(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as any;
    const { page, limit, skip } = pagination(query);
    const dbQuery: any = { schoolId: getTenantId(req) };
    const search = String(query.search ?? "").trim();
    if (search) {
      const escaped = escapeRegex(search);
      dbQuery.$or = [
        { firstName: { $regex: escaped, $options: "i" } },
        { lastName: { $regex: escaped, $options: "i" } },
        { admissionNo: { $regex: escaped, $options: "i" } },
        { phone: { $regex: escaped, $options: "i" } },
      ];
    }
    const [data, total] = await Promise.all([
      Student.find(dbQuery).populate("classId sectionId").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Student.countDocuments(dbQuery),
    ]);
    res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function getAttendanceReport(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as any;
    const { page, limit, skip } = pagination(query);
    const dbQuery: any = { schoolId: getTenantId(req) };
    if (query.startDate || query.endDate) {
      dbQuery.date = {};
      if (query.startDate) dbQuery.date.$gte = new Date(`${query.startDate}T00:00:00.000Z`);
      if (query.endDate) dbQuery.date.$lt = new Date(`${query.endDate}T00:00:00.000Z`);
      if (query.endDate) dbQuery.date.$lt.setUTCDate(dbQuery.date.$lt.getUTCDate() + 1);
    }
    const [data, total] = await Promise.all([
      Attendance.find(dbQuery).populate("classId sectionId markedBy").sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Attendance.countDocuments(dbQuery),
    ]);
    res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function getFeeReport(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as any;
    const { page, limit, skip } = pagination(query);
    const schoolId = getTenantId(req);
    const dbQuery: any = { schoolId };
    const search = String(query.search ?? "").trim();
    if (search) {
      const escaped = escapeRegex(search);
      const students = await Student.find({ schoolId, $or: [
        { firstName: { $regex: escaped, $options: "i" } },
        { lastName: { $regex: escaped, $options: "i" } },
        { admissionNo: { $regex: escaped, $options: "i" } },
      ] }).select("_id").lean();
      dbQuery.studentId = { $in: students.map((student) => student._id) };
    }
    const [data, total] = await Promise.all([
      Fee.find(dbQuery).populate("studentId feeStructureId").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Fee.countDocuments(dbQuery),
    ]);
    res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}
