import mongoose from "mongoose";
import { FeeItem, Fee } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { createAuditLog } from "./auditLog.js";

export async function listStudentFeeItems(schoolId: string, studentId: string, academicYear?: string) {
  const query: any = { schoolId, studentId };
  if (academicYear) query.academicYear = academicYear;
  return FeeItem.find(query).populate("feeHeadId feeId").sort({ dueDate: 1, createdAt: 1 }).lean();
}

export async function createFeeItem(schoolId: string, data: { studentId: string; feeId: string; feeHeadId: string; label: string; amount: number; dueDate?: string }, actorId: string) {
  const fee = await Fee.findOne({ _id: data.feeId, schoolId, studentId: data.studentId }).lean();
  if (!fee) throw AppError.badRequest("Fee must belong to the selected student and school");
  const item = await FeeItem.create({
    schoolId,
    studentId: data.studentId,
    feeId: data.feeId,
    feeHeadId: data.feeHeadId,
    academicYear: fee.academicYear,
    label: data.label,
    amount: data.amount,
    discount: 0,
    fine: 0,
    totalDue: data.amount,
    paidAmount: 0,
    balance: data.amount,
    status: data.amount === 0 ? "waived" : "pending",
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined
  });
  await createAuditLog({ userId: actorId, action: "CREATE", entity: "FeeItem", entityId: item._id.toString(), after: item.toObject() });
  return item;
}

export async function adjustFeeItem(schoolId: string, itemId: string, actorId: string, input: { type: "discount" | "waiver" | "surcharge" | "amount_override"; amount: number; reason: string }) {
  const session = await mongoose.startSession();
  try {
    let result: any;
    await session.withTransaction(async () => {
      const item = await FeeItem.findOne({ _id: itemId, schoolId }).session(session);
      if (!item) throw AppError.notFound("Fee item not found");
      const before = item.toObject();
      if (item.paidAmount > 0 && input.type !== "surcharge") throw AppError.conflict("Paid or partially paid fee items require a controlled credit/refund workflow");
      let discount = item.discount;
      let amount = item.amount;
      if (input.type === "discount" || input.type === "waiver") discount += input.amount;
      if (input.type === "amount_override") amount = input.amount;
      if (input.type === "surcharge") amount += input.amount;
      if (discount > amount) throw AppError.badRequest("Discount cannot exceed the fee item amount");
      const totalDue = amount - discount + item.fine;
      if (totalDue < 0) throw AppError.badRequest("Fee item total cannot be negative");
      item.amount = amount;
      item.discount = discount;
      item.totalDue = totalDue;
      item.balance = totalDue - item.paidAmount;
      if (item.balance < 0) throw AppError.conflict("Adjustment would invalidate collected payment history");
      item.status = item.balance === 0 ? (totalDue === 0 ? "waived" : "paid") : item.paidAmount > 0 ? "partial" : "pending";
      item.adjustments.push({ type: input.type, amount: input.amount, reason: input.reason, actorId: new mongoose.Types.ObjectId(actorId), createdAt: new Date() });
      await item.save({ session });
      await createAuditLog({ userId: actorId, action: "FEE_ITEM_ADJUST", entity: "FeeItem", entityId: item._id.toString(), before, after: item.toObject() });
      result = item;
    });
    return result;
  } finally { await session.endSession(); }
}
