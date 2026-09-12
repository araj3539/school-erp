import mongoose, { Document, Schema, Types } from "mongoose";
import { FeeItem } from "./FeeItem.js";
import { Payment } from "./Payment.js";

export type PaymentAllocationType = "allocation" | "reversal";
export interface IPaymentAllocation extends Document {
  schoolId: Types.ObjectId;
  paymentId: Types.ObjectId;
  feeItemId: Types.ObjectId;
  amount: number;
  type: PaymentAllocationType;
  reversalId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const schema = new Schema<IPaymentAllocation>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  paymentId: { type: Schema.Types.ObjectId, ref: "Payment", required: true },
  feeItemId: { type: Schema.Types.ObjectId, ref: "FeeItem", required: true },
  amount: { type: Number, required: true, min: 0.01 },
  type: { type: String, enum: ["allocation", "reversal"], required: true },
  reversalId: { type: Schema.Types.ObjectId, ref: "PaymentReversal" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

schema.pre("validate", async function () {
  const [payment, item] = await Promise.all([
    Payment.exists({ _id: this.paymentId, schoolId: this.schoolId }),
    FeeItem.exists({ _id: this.feeItemId, schoolId: this.schoolId })
  ]);
  if (!payment) throw new Error("Payment allocation must belong to the same school as its payment");
  if (!item) throw new Error("Payment allocation fee item must belong to the same school");
});

// Allocations are ledger entries; corrections create reversal entries rather than editing history.
schema.pre("save", function () { if (!this.isNew && this.isModified()) throw new Error("Payment allocations are immutable"); });
schema.pre("findOneAndUpdate", function () { throw new Error("Payment allocations are immutable"); });
schema.pre("updateOne", function () { throw new Error("Payment allocations are immutable"); });
schema.pre("deleteOne", function () { throw new Error("Payment allocations are immutable"); });
schema.pre("deleteMany", function () { throw new Error("Payment allocations are immutable"); });

schema.index({ schoolId: 1, paymentId: 1, feeItemId: 1, type: 1 }, { unique: true, partialFilterExpression: { type: "allocation" } });
schema.index({ schoolId: 1, feeItemId: 1, createdAt: 1 });
schema.index({ schoolId: 1, reversalId: 1 }, { sparse: true });

export const PaymentAllocation = mongoose.model<IPaymentAllocation>("PaymentAllocation", schema);
