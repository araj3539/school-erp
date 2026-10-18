import mongoose from "mongoose";
import { Fee } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { createAuditLog } from "./auditLog.js";
import { FeeStatus } from "@school-erp/shared";

export async function adjustStudentFee(schoolId: string, feeId: string, actorId: string, input: { type: "discount" | "waiver" | "surcharge" | "amount_override"; amount?: number; percent?: number; reason: string }) {
  const session = await mongoose.startSession();
  try {
    let result: any;
    await session.withTransaction(async () => {
      const fee = await Fee.findOne({ _id: feeId, schoolId }).session(session);
      if (!fee) throw AppError.notFound("Fee not found");
      const before = fee.toObject();
      if (fee.paidAmount > 0 && input.type !== "surcharge") throw AppError.conflict("Paid or partially paid fees require a controlled credit/refund workflow");
      const value = Math.round((input.percent !== undefined ? fee.amount * (input.percent / 100) : input.amount ?? 0) * 100) / 100;
      if (!Number.isFinite(value) || value < 0) throw AppError.badRequest("Adjustment amount must be a valid non-negative number");
      let amount = fee.amount;
      let discount = fee.discount;
      if (input.type === "discount" || input.type === "waiver") discount += value;
      if (input.type === "amount_override") amount = value;
      if (input.type === "surcharge") amount += value;
      if (discount > amount) throw AppError.badRequest("Discount cannot exceed the fee amount");
      const totalDue = amount - discount + fee.fine;
      if (totalDue < 0) throw AppError.badRequest("Fee total cannot be negative");
      const balance = totalDue - fee.paidAmount;
      if (balance < 0) throw AppError.conflict("Adjustment would invalidate collected payment history");
      fee.amount = amount;
      fee.discount = discount;
      fee.totalDue = totalDue;
      fee.balance = balance;
      fee.status = balance < 0.009 ? (totalDue === 0 ? FeeStatus.WAIVED : FeeStatus.PAID) : fee.paidAmount > 0 ? FeeStatus.PARTIAL : FeeStatus.PENDING;
      await fee.save({ session });
      await createAuditLog({ userId: actorId, action: "FEE_ADJUST", entity: "Fee", entityId: fee._id.toString(), before: before as any, after: { ...fee.toObject(), adjustment: input } as any });
      result = fee;
    });
    return result;
  } finally { await session.endSession(); }
}
