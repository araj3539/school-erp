import { Request, Response, NextFunction } from "express";
import { Fee, IFee, FeeStructure, IFeeStructure, Payment, IPayment, Student, IStudent, Class, IClass, AcademicYear, IAcademicYear } from "../models/index.js";
import { CreateFeeStructureSchema, CreatePaymentSchema, FeeQuerySchema, PaymentQuerySchema, DateRangeSchema, ObjectIdSchema } from "../validators/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { FeeStatus, FeeType, generateReceiptNumber } from "@school-erp/shared";
import { generateReceiptPDF } from "../services/pdf.js";

export async function getFeeStructures(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, academicYear } = req.query;
    const query: any = {};
    if (classId) query.classId = classId;
    if (academicYear) query.academicYear = academicYear;
    const structures = await FeeStructure.find(query).populate("classId academicYear").lean();
    res.json({ data: structures });
  } catch (error) {
    next(error);
  }
}

export async function createFeeStructure(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateFeeStructureSchema.parse(req.body);
    const existing = await FeeStructure.findOne({
      classId: data.classId,
      feeType: data.feeType,
      academicYear: data.academicYear
    });
    if (existing) {
      throw AppError.conflict("Fee structure already exists for this class/type/year");
    }
    const structure = await FeeStructure.create(data);
    await createAuditLog({
      userId: req.user!.userId,
      action: "CREATE",
      entity: "FeeStructure",
      entityId: structure._id.toString(),
      after: data
    });
    res.status(201).json({ feeStructure: structure });
  } catch (error) {
    next(error);
  }
}

export async function updateFeeStructure(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const data = req.validatedBody as any;
    const structure = await FeeStructure.findByIdAndUpdate(id, data, { new: true });
    if (!structure) {
      throw AppError.notFound("Fee structure not found");
    }
    await createAuditLog({
      userId: req.user!.userId,
      action: "UPDATE",
      entity: "FeeStructure",
      entityId: structure._id.toString(),
      after: data
    });
    res.json({ feeStructure: structure });
  } catch (error) {
    next(error);
  }
}

export async function deleteFeeStructure(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    await FeeStructure.findByIdAndDelete(id);
    await createAuditLog({
      userId: req.user!.userId,
      action: "DELETE",
      entity: "FeeStructure",
      entityId: id
    });
    res.json({ message: "Fee structure deleted" });
  } catch (error) {
    next(error);
  }
}

export async function getFees(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as any;
    const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query;
    const dbQuery: any = {};
    if (filters.studentId) dbQuery.studentId = filters.studentId;
    if (filters.status) dbQuery.status = filters.status;
    if (filters.classId) {
      const students = await Student.find({ classId: filters.classId }).select("_id");
      dbQuery.studentId = { $in: students.map((s) => s._id) };
    }
    if (filters.academicYear) dbQuery.academicYear = filters.academicYear;
    if (filters.search) {
      // Search would require a more complex query, skipping for now
    }
    const sort: any = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    else sort.createdAt = -1;
    const skip = (page - 1) * limit;
    const [fees, total] = await Promise.all([
      Fee.find(dbQuery).populate("studentId feeStructureId").sort(sort).skip(skip).limit(limit).lean(),
      Fee.countDocuments(dbQuery)
    ]);
    res.json({
      data: fees,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudentFees(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const { academicYear } = req.validatedQuery as any;
    const dbQuery: any = { studentId: id };
    if (academicYear) dbQuery.academicYear = academicYear;
    const fees = await Fee.find(dbQuery).populate("feeStructureId").lean();
    const summary = {
      totalDue: 0,
      paid: 0,
      balance: 0,
      overdue: 0
    };
    fees.forEach((fee) => {
      summary.totalDue += fee.totalDue;
      summary.paid += fee.paidAmount;
      summary.balance += fee.balance;
      if (fee.status === FeeStatus.OVERDUE) summary.overdue += fee.balance;
    });
    res.json({ fees, summary });
  } catch (error) {
    next(error);
  }
}

export async function generateFees(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, academicYear } = req.body;
    if (!classId || !academicYear) {
      throw AppError.badRequest("classId and academicYear required");
    }
    const students = await Student.find({ classId, status: "active" }).lean();
    const structures = await FeeStructure.find({ classId, academicYear }).lean();
    if (students.length === 0 || structures.length === 0) {
      throw AppError.badRequest("No students or fee structures found");
    }

    // Get all existing fees for these students/structures/year to avoid duplicates
    const studentIds = students.map(s => s._id);
    const structureIds = structures.map(s => s._id);
    const existingFees = await Fee.find({
      studentId: { $in: studentIds },
      feeStructureId: { $in: structureIds },
      academicYear
    }).lean();

    const existingSet = new Set(
      existingFees.map(f => `${f.studentId}-${f.feeStructureId}-${f.academicYear}`)
    );

    const feesToCreate = [];
    for (const student of students) {
      for (const structure of structures) {
        const key = `${student._id}-${structure._id}-${academicYear}`;
        if (!existingSet.has(key)) {
          const totalDue = structure.amount;
          feesToCreate.push({
            studentId: student._id,
            feeStructureId: structure._id,
            amount: structure.amount,
            discount: 0,
            fine: 0,
            totalDue,
            paidAmount: 0,
            balance: totalDue,
            status: FeeStatus.PENDING,
            academicYear
          });
        }
      }
    }

    let results: any[] = [];
    if (feesToCreate.length > 0) {
      results = await Fee.insertMany(feesToCreate);
    }

    await createAuditLog({
      userId: req.user!.userId,
      action: "GENERATE_FEES",
      entity: "Fee",
      entityId: classId,
      after: { generated: results.length, classId, academicYear }
    });
    res.json({ generated: results.length, fees: results });
  } catch (error) {
    next(error);
  }
}

export async function collectPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreatePaymentSchema.parse({
      ...req.body,
      receiptNo: generateReceiptNumber(),
      collectedBy: req.user!.userId
    });
    const fee = await Fee.findById(data.feeId).populate("feeStructureId studentId");
    if (!fee) {
      throw AppError.notFound("Fee not found");
    }
    if (data.amount > fee.balance) {
      throw AppError.badRequest("Payment amount exceeds balance");
    }
    const payment = await Payment.create(data);
    fee.paidAmount += data.amount;
    fee.balance = fee.totalDue - fee.paidAmount;
    if (fee.balance <= 0) {
      fee.status = FeeStatus.PAID;
      fee.balance = 0;
    } else if (fee.paidAmount > 0) {
      fee.status = FeeStatus.PARTIAL;
    }
    await fee.save();
    await createAuditLog({
      userId: req.user!.userId,
      action: "CREATE",
      entity: "Payment",
      entityId: payment._id.toString(),
      after: { amount: data.amount, feeId: data.feeId, mode: data.mode }
    });
    const receiptPdf = await generateReceiptPDF({
      ...payment,
      fee: { ...fee, feeStructure: fee.feeStructureId, student: fee.studentId },
      collectedBy: { fullName: req.user!.email }
    } as any);
    res.json({ payment, receiptPdf: receiptPdf.toString("base64") });
  } catch (error) {
    next(error);
  }
}

export async function getPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const query = PaymentQuerySchema.parse(req.query);
    const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query;
    const dbQuery: any = {};
    if (filters.studentId) dbQuery.studentId = filters.studentId;
    if (filters.feeId) dbQuery.feeId = filters.feeId;
    if (filters.startDate || filters.endDate) {
      dbQuery.date = {};
      if (filters.startDate) dbQuery.date.$gte = new Date(filters.startDate as string);
      if (filters.endDate) dbQuery.date.$lte = new Date(filters.endDate as string);
    }
    const sort: any = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    else sort.date = -1;
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find(dbQuery).populate("feeId studentId collectedBy").sort(sort).skip(skip).limit(limit).lean(),
      Payment.countDocuments(dbQuery)
    ]);
    res.json({
      data: payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

export async function getDailyCollectionReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    const payments = await Payment.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate("feeId studentId").lean();
    const summary = {
      total: 0,
      cash: 0,
      upi: 0,
      card: 0,
      bankTransfer: 0,
      cheque: 0
    };
    payments.forEach((p) => {
      summary.total += p.amount;
      summary[p.mode as keyof typeof summary] += p.amount;
    });
    res.json({ payments, summary, date: targetDate });
  } catch (error) {
    next(error);
  }
}

export async function getMonthlyCollectionReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      throw AppError.badRequest("month and year required");
    }
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
    const payments = await Payment.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate("feeId studentId").lean();
    const summary = {
      total: 0,
      cash: 0,
      upi: 0,
      card: 0,
      bankTransfer: 0,
      cheque: 0
    };
    const dailyData: Record<string, number> = {};
    payments.forEach((p) => {
      summary.total += p.amount;
      summary[p.mode as keyof typeof summary] += p.amount;
      const day = new Date(p.date).getDate().toString();
      dailyData[day] = (dailyData[day] || 0) + p.amount;
    });
    res.json({ payments, summary, dailyData, month: Number(month), year: Number(year) });
  } catch (error) {
    next(error);
  }
}

export async function getReceiptPDF(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const payment = await Payment.findById(id).populate({
      path: "feeId",
      populate: { path: "feeStructureId studentId" }
    });
    if (!payment) {
      throw AppError.notFound("Payment not found");
    }
    const pdf = await generateReceiptPDF({
      ...payment,
      fee: { ...payment.feeId, feeStructure: (payment.feeId as any).feeStructureId, student: (payment.feeId as any).studentId },
      collectedBy: { fullName: (payment.collectedBy as any)?.email || "Unknown" }
    } as any);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=receipt-${payment.receiptNo}.pdf`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
}