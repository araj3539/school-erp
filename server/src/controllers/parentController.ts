import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Attendance, Fee, Student } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { computeEffectiveFeeStatus } from "../services/feeStatus.js";
import { parseCalendarDate, addCalendarDays } from "../utils/calendarDate.js";

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
      const dateRange: Record<string, Date> = {};
      try {
        if (startDate) dateRange.$gte = parseCalendarDate(String(startDate));
        if (endDate) dateRange.$lt = addCalendarDays(parseCalendarDate(String(endDate)), 1);
      } catch {
        throw AppError.badRequest("Invalid date; expected YYYY-MM-DD");
      }
      query.date = dateRange;
    }
    const attendance = await Attendance.find(query).sort({ date: -1 }).lean();
    attendance.forEach((doc: any) => { doc.records = (doc.records as any[]).filter((record: any) => record.studentId.toString() === child._id.toString()); });
    res.json({ childId: child._id, attendance });
  } catch (error) {
    next(error);
  }
}

export async function getMyChildFees(req: Request, res: Response, next: NextFunction) {
  try {
    const child = await getChild(req);
    const { academicYear } = req.query;
    if (academicYear && !mongoose.isValidObjectId(String(academicYear))) throw AppError.badRequest("Invalid academicYear");
    const query: Record<string, unknown> = { schoolId: schoolId(req), studentId: child._id };
    if (academicYear) query.academicYear = academicYear;
    const fees = await Fee.find(query).populate("feeStructureId").sort({ createdAt: -1 }).lean();
    const now = new Date();
    const summary = { totalDue: 0, paid: 0, balance: 0, overdue: 0 };
    fees.forEach((fee: any) => {
      summary.totalDue += fee.totalDue;
      summary.paid += fee.paidAmount;
      summary.balance += fee.balance;
      if (computeEffectiveFeeStatus(fee.status, fee.feeStructureId?.dueDate, fee.balance, now) === "overdue") summary.overdue += fee.balance;
    });
    res.json({ childId: child._id, fees, summary });
  } catch (error) {
    next(error);
  }
}
