import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Fee, FeeStructure, Payment, Student } from "../models/index.js";
import { CreateFeeStructureSchema, CreatePaymentSchema, PaymentQuerySchema } from "../validators/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { FeeStatus, generateReceiptNumber } from "@school-erp/shared";
import { generateReceiptPDF } from "../services/pdf.js";

const tenantId = (req: Request) => req.user!.schoolId;

export async function getFeeStructures(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, academicYear } = req.query;
    const query: Record<string, unknown> = { schoolId: tenantId(req) };
    if (classId) query.classId = classId;
    if (academicYear) query.academicYear = academicYear;
    const structures = await FeeStructure.find(query).populate("classId academicYear").lean();
    res.json({ data: structures });
  } catch (error) { next(error); }
}

export async function createFeeStructure(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = tenantId(req);
    const data = CreateFeeStructureSchema.parse(req.body);
    const existing = await FeeStructure.findOne({ schoolId, classId: data.classId, feeType: data.feeType, academicYear: data.academicYear });
    if (existing) throw AppError.conflict("Fee structure already exists for this class/type/year");
    const structure = await FeeStructure.create({ ...data, schoolId });
    await createAuditLog({ userId: req.user!.userId, action: "CREATE", entity: "FeeStructure", entityId: structure._id.toString(), after: data });
    res.status(201).json({ feeStructure: structure });
  } catch (error) { next(error); }
}

export async function updateFeeStructure(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const data = req.validatedBody as Record<string, unknown>;
    const structure = await FeeStructure.findOneAndUpdate({ _id: id, schoolId: tenantId(req) }, data, { new: true, runValidators: true });
    if (!structure) throw AppError.notFound("Fee structure not found");
    await createAuditLog({ userId: req.user!.userId, action: "UPDATE", entity: "FeeStructure", entityId: structure._id.toString(), after: data });
    res.json({ feeStructure: structure });
  } catch (error) { next(error); }
}

export async function deleteFeeStructure(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const structure = await FeeStructure.findOneAndDelete({ _id: id, schoolId: tenantId(req) });
    if (!structure) throw AppError.notFound("Fee structure not found");
    await createAuditLog({ userId: req.user!.userId, action: "DELETE", entity: "FeeStructure", entityId: id });
    res.json({ message: "Fee structure deleted" });
  } catch (error) { next(error); }
}

export async function getFees(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as any;
    const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query;
    const dbQuery: Record<string, unknown> = { schoolId: tenantId(req) };
    if (filters.studentId) dbQuery.studentId = filters.studentId;
    if (filters.status) dbQuery.status = filters.status;
    if (filters.classId) {
      const students = await Student.find({ schoolId: tenantId(req), classId: filters.classId }).select("_id").lean();
      dbQuery.studentId = { $in: students.map((s: { _id: mongoose.Types.ObjectId }) => s._id) };
    }
    if (filters.academicYear) dbQuery.academicYear = filters.academicYear;
    const sort: Record<string, 1 | -1> = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    else sort.createdAt = -1;
    const skip = (page - 1) * limit;
    const [fees, total] = await Promise.all([
      Fee.find(dbQuery).populate("studentId feeStructureId").sort(sort).skip(skip).limit(limit).lean(),
      Fee.countDocuments(dbQuery)
    ]);
    res.json({ data: fees, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function getStudentFees(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const { academicYear } = req.query;
    const student = await Student.findOne({ _id: id, schoolId: tenantId(req) }).select("_id userId parentIds").lean();
    if (!student) throw AppError.notFound("Student not found");
    if (req.user!.role === "student" && student.userId?.toString() !== req.user!.userId) {
      throw AppError.forbidden("Students can only access their own fees");
    }
    if (req.user!.role === "parent" && !student.parentIds.some((parentId) => parentId.toString() === req.user!.userId)) {
      throw AppError.forbidden("Parents can only access fees for linked children");
    }
    const dbQuery: Record<string, unknown> = { schoolId: tenantId(req), studentId: id };
    if (academicYear) dbQuery.academicYear = academicYear;
    const fees = await Fee.find(dbQuery).populate("feeStructureId").lean();
    const summary = { totalDue: 0, paid: 0, balance: 0, overdue: 0 };
    fees.forEach((fee) => { summary.totalDue += fee.totalDue; summary.paid += fee.paidAmount; summary.balance += fee.balance; if (fee.status === FeeStatus.OVERDUE) summary.overdue += fee.balance; });
    res.json({ fees, summary });
  } catch (error) { next(error); }
}

export async function generateFees(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = tenantId(req);
    const { classId, academicYear } = req.body;
    if (!classId || !academicYear) throw AppError.badRequest("classId and academicYear required");
    const [students, structures] = await Promise.all([
      Student.find({ schoolId, classId, status: "active" }).lean(),
      FeeStructure.find({ schoolId, classId, academicYear }).lean()
    ]);
    if (students.length === 0 || structures.length === 0) throw AppError.badRequest("No students or fee structures found");
    const studentIds = students.map((s: { _id: mongoose.Types.ObjectId }) => s._id);
    const structureIds = structures.map((s: { _id: mongoose.Types.ObjectId }) => s._id);
    const existingFees = await Fee.find({ schoolId, studentId: { $in: studentIds }, feeStructureId: { $in: structureIds }, academicYear }).lean();
    const existingSet = new Set(existingFees.map((f) => `${f.studentId}-${f.feeStructureId}-${f.academicYear}`));
    const feesToCreate = [];
    for (const student of students) for (const structure of structures) {
      const key = `${student._id}-${structure._id}-${academicYear}`;
      if (!existingSet.has(key)) feesToCreate.push({ schoolId, studentId: student._id, feeStructureId: structure._id, amount: structure.amount, discount: 0, fine: 0, totalDue: structure.amount, paidAmount: 0, balance: structure.amount, status: FeeStatus.PENDING, academicYear });
    }
    const results = feesToCreate.length ? await Fee.insertMany(feesToCreate) : [];
    await createAuditLog({ userId: req.user!.userId, action: "GENERATE_FEES", entity: "Fee", entityId: classId, after: { generated: results.length, classId, academicYear } });
    res.json({ generated: results.length, fees: results });
  } catch (error) { next(error); }
}

export async function collectPayment(req: Request, res: Response, next: NextFunction) {
  const session = await mongoose.startSession();
  try {
    const schoolId = tenantId(req);
    const receiptNo = generateReceiptNumber();
    const data = CreatePaymentSchema.parse({ ...req.body, receiptNo, collectedBy: req.user!.userId });
    let paymentId: mongoose.Types.ObjectId | undefined;

    await session.withTransaction(async () => {
      const fee = await Fee.findOne({ _id: data.feeId, schoolId }).session(session).populate("feeStructureId studentId");
      if (!fee) throw AppError.notFound("Fee not found");
      if (data.amount <= 0) throw AppError.badRequest("Payment amount must be greater than zero");
      if (data.amount > fee.balance) throw AppError.badRequest("Payment amount exceeds balance");
      const studentId = (fee.studentId as any)._id;
      const payment = new Payment({ ...data, schoolId, studentId });
      await payment.save({ session });
      fee.paidAmount += data.amount;
      fee.balance = Math.max(0, fee.totalDue - fee.paidAmount);
      fee.status = fee.balance === 0 ? FeeStatus.PAID : FeeStatus.PARTIAL;
      await fee.save({ session });
      await createAuditLog({ userId: req.user!.userId, action: "CREATE", entity: "Payment", entityId: payment._id.toString(), after: { amount: data.amount, feeId: data.feeId, mode: data.mode, receiptNo }, session });
      paymentId = payment._id;
    });

    const payment = await Payment.findOne({ _id: paymentId!, schoolId }).populate("collectedBy").lean();
    if (!payment) throw AppError.notFound("Payment not found after collection");
    const fee = await Fee.findOne({ _id: payment.feeId, schoolId }).populate("feeStructureId studentId").lean();
    if (!fee) throw AppError.notFound("Fee not found after collection");
    const receiptPdf = await generateReceiptPDF({ ...payment, fee: { ...fee, feeStructure: fee.feeStructureId, student: fee.studentId }, collectedBy: { fullName: req.user!.email } } as any);
    res.json({ payment, receiptPdf: receiptPdf.toString("base64") });
  } catch (error) { next(error); }
  finally { await session.endSession(); }
}

export async function getPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const query = PaymentQuerySchema.parse(req.query);
    const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query;
    const dbQuery: Record<string, unknown> = { schoolId: tenantId(req) };
    if (filters.studentId) dbQuery.studentId = filters.studentId;
    if (filters.feeId) dbQuery.feeId = filters.feeId;
    if (filters.startDate || filters.endDate) { dbQuery.date = {}; if (filters.startDate) (dbQuery.date as any).$gte = new Date(filters.startDate as string); if (filters.endDate) (dbQuery.date as any).$lte = new Date(filters.endDate as string); }
    const sort: Record<string, 1 | -1> = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1; else sort.date = -1;
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([Payment.find(dbQuery).populate("feeId studentId collectedBy").sort(sort).skip(skip).limit(limit).lean(), Payment.countDocuments(dbQuery)]);
    res.json({ data: payments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function getDailyCollectionReport(req: Request, res: Response, next: NextFunction) {
  try {
    const targetDate = req.query.date ? new Date(req.query.date as string) : new Date();
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);
    const payments = await Payment.find({ schoolId: tenantId(req), date: { $gte: startOfDay, $lte: endOfDay } }).populate("feeId studentId").lean();
    const summary = { total: 0, cash: 0, upi: 0, card: 0, bankTransfer: 0, cheque: 0 };
    payments.forEach((p) => { summary.total += p.amount; const key = p.mode as keyof typeof summary; if (key in summary) summary[key] += p.amount; });
    res.json({ payments, summary, date: targetDate });
  } catch (error) { next(error); }
}

export async function getMonthlyCollectionReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { month, year } = req.query;
    if (!month || !year) throw AppError.badRequest("month and year required");
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
    const payments = await Payment.find({ schoolId: tenantId(req), date: { $gte: startDate, $lte: endDate } }).populate("feeId studentId").lean();
    const summary = { total: 0, cash: 0, upi: 0, card: 0, bankTransfer: 0, cheque: 0 };
    const dailyData: Record<string, number> = {};
    payments.forEach((p) => { summary.total += p.amount; const key = p.mode as keyof typeof summary; if (key in summary) summary[key] += p.amount; const day = new Date(p.date).getDate().toString(); dailyData[day] = (dailyData[day] || 0) + p.amount; });
    res.json({ payments, summary, dailyData, month: Number(month), year: Number(year) });
  } catch (error) { next(error); }
}

export async function getReceiptPDF(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const payment = await Payment.findOne({ _id: id, schoolId: tenantId(req) }).populate({ path: "feeId", populate: { path: "feeStructureId studentId" } }).lean();
    if (!payment) throw AppError.notFound("Payment not found");
    const pdf = await generateReceiptPDF({ ...payment, fee: { ...(payment.feeId as any), feeStructure: (payment.feeId as any).feeStructureId, student: (payment.feeId as any).studentId }, collectedBy: { fullName: (payment.collectedBy as any)?.email || "Unknown" } } as any);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=receipt-${payment.receiptNo}.pdf`);
    res.send(pdf);
  } catch (error) { next(error); }
}
