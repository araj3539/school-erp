import { Request, Response, NextFunction } from "express";
import { Attendance, IAttendance, IAttendanceRecord, Student, IStudent, Class, IClass, Section, ISection } from "../models";
import { MarkAttendanceSchema, AttendanceQuerySchema, DateRangeSchema, ObjectIdSchema } from "../validators";
import { createAuditLog } from "../services/auditLog";
import { AppError } from "../utils/errors";
import { AttendanceStatus } from "../shared-types";
import { Types } from "mongoose";

export async function getAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const query = AttendanceQuerySchema.parse(req.query);
    const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query;
    const dbQuery: any = {};
    if (filters.classId) dbQuery.classId = filters.classId;
    if (filters.sectionId) dbQuery.sectionId = filters.sectionId;
    if (filters.date) {
      const date = new Date(filters.date as string);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      dbQuery.date = { $gte: date, $lt: nextDate };
    }
    if (filters.startDate || filters.endDate) {
      dbQuery.date = {};
      if (filters.startDate) dbQuery.date.$gte = new Date(filters.startDate as string);
      if (filters.endDate) dbQuery.date.$lte = new Date(filters.endDate as string);
    }
    const sort: any = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    else sort.date = -1;
    const skip = (page - 1) * limit;
    const [attendance, total] = await Promise.all([
      Attendance.find(dbQuery).populate("classId sectionId markedBy").sort(sort).skip(skip).limit(limit).lean(),
      Attendance.countDocuments(dbQuery)
    ]);
    res.json({
      data: attendance,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

export async function markAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = MarkAttendanceSchema.parse(req.body);
    const existing = await Attendance.findOne({
      date: new Date(data.date),
      classId: data.classId,
      sectionId: data.sectionId
    });
    if (existing) {
      existing.records = data.records;
      existing.markedBy = req.user!.userId;
      await existing.save();
      await createAuditLog({
        userId: req.user!.userId,
        action: "UPDATE",
        entity: "Attendance",
        entityId: existing._id.toString(),
        after: { recordsCount: data.records.length }
      });
      res.json({ attendance: existing });
    } else {
      const attendance = await Attendance.create({
        ...data,
        date: new Date(data.date),
        markedBy: req.user!.userId
      });
      await createAuditLog({
        userId: req.user!.userId,
        action: "CREATE",
        entity: "Attendance",
        entityId: attendance._id.toString(),
        after: { recordsCount: data.records.length }
      });
      res.status(201).json({ attendance });
    }
  } catch (error) {
    next(error);
  }
}

export async function getStudentAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = ObjectIdSchema.parse(req.params);
    const { startDate, endDate } = DateRangeSchema.parse(req.query);
    const dbQuery: any = { "records.studentId": new Types.ObjectId(id) };
    if (startDate || endDate) {
      dbQuery.date = {};
      if (startDate) dbQuery.date.$gte = new Date(startDate);
      if (endDate) dbQuery.date.$lte = new Date(endDate);
    }
    const attendance = await Attendance.find(dbQuery).sort({ date: -1 }).lean();
    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      onLeave: 0
    };
    attendance.forEach((a) => {
      const record = a.records.find((r) => r.studentId.toString() === id);
      if (record) {
        summary[record.status as keyof typeof summary]++;
      }
    });
    res.json({ attendance, summary });
  } catch (error) {
    next(error);
  }
}

export async function getMonthlyAttendanceReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, sectionId, month, year } = req.query;
    if (!classId || !sectionId || !month || !year) {
      throw AppError.badRequest("classId, sectionId, month, year required");
    }
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
    const students = await Student.find({ classId, sectionId, status: "active" }).lean();
    const attendance = await Attendance.find({
      classId,
      sectionId,
      date: { $gte: startDate, $lte: endDate }
    }).lean();
    const report = students.map((student: any) => {
      const studentAttendance = attendance.map((a) => {
        const record = a.records.find((r) => r.studentId.toString() === student._id.toString());
        return record ? record.status : null;
      });
      const counts = {
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        onLeave: 0
      };
      studentAttendance.forEach((status) => {
        if (status) counts[status as keyof typeof counts]++;
      });
      return {
        studentId: student._id,
        admissionNo: student.admissionNo,
        name: `${student.firstName} ${student.lastName}`,
        attendance: studentAttendance,
        counts
      };
    });
    res.json({ report, month: Number(month), year: Number(year) });
  } catch (error) {
    next(error);
  }
}