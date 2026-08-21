import { Request, Response, NextFunction } from "express";
import { Attendance, Fee, Student } from "../models/index.js";
import { AppError } from "../utils/errors.js";

function schoolId(req: Request) {
  if (!req.user?.schoolId) throw AppError.unauthorized("School context is required");
  return req.user.schoolId;
}

export async function getMyChildren(req: Request, res: Response, next: NextFunction) {
  try {
    const children = await Student.find({ schoolId: schoolId(req), parentIds: req.user!.userId })
      .populate("classId sectionId")
      .select("admissionNo firstName lastName dob gender classId sectionId status documents")
      .sort({ firstName: 1, lastName: 1 })
      .lean();
    res.json({ data: children });
  } catch (error) {
    next(error);
  }
}

async function getChild(req: Request) {
  const child = await Student.findOne({
    _id: req.params.id,
    schoolId: schoolId(req),
    parentIds: req.user!.userId,
  }).select("_id admissionNo firstName lastName classId sectionId status").lean();
  if (!child) throw AppError.notFound("Child not found");
  return child;
}

export async function getMyChild(req: Request, res: Response, next: NextFunction) {
  try {
    const child = await getChild(req);
    res.json({ child });
  } catch (error) {
    next(error);
  }
}

export async function getMyChildAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const child = await getChild(req);
    const { startDate, endDate } = req.query;
    const query: Record<string, unknown> = {
      schoolId: schoolId(req),
      "records.studentId": child._id,
    };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string, Date>).$gte = new Date(String(startDate));
      if (endDate) (query.date as Record<string, Date>).$lte = new Date(String(endDate));
    }
    const attendance = await Attendance.find(query).sort({ date: -1 }).lean();
    res.json({ childId: child._id, attendance });
  } catch (error) {
    next(error);
  }
}

export async function getMyChildFees(req: Request, res: Response, next: NextFunction) {
  try {
    const child = await getChild(req);
    const { academicYear } = req.query;
    const query: Record<string, unknown> = { schoolId: schoolId(req), studentId: child._id };
    if (academicYear) query.academicYear = academicYear;
    const fees = await Fee.find(query).populate("feeStructureId").sort({ createdAt: -1 }).lean();
    const summary = { totalDue: 0, paid: 0, balance: 0, overdue: 0 };
    fees.forEach((fee) => {
      summary.totalDue += fee.totalDue;
      summary.paid += fee.paidAmount;
      summary.balance += fee.balance;
      if (fee.status === "overdue") summary.overdue += fee.balance;
    });
    res.json({ childId: child._id, fees, summary });
  } catch (error) {
    next(error);
  }
}
