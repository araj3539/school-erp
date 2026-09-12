import mongoose, { Document, Schema, Types } from "mongoose";
import { PaymentOrder } from "./PaymentOrder.js";

export type BankTransactionStatus = "unmatched" | "ambiguous" | "matched" | "ignored";
export interface IBankTransaction extends Document {
  schoolId: Types.ObjectId;
  utr: string;
  amount: number;
  date: Date;
  payerUpiId?: string;
  source: "manual_import" | "bank_api";
  sourceId?: string;
  status: BankTransactionStatus;
  matchedOrderId?: Types.ObjectId;
  candidateOrderIds: Types.ObjectId[];
  importedBy: Types.ObjectId;
  importedAt: Date;
  createdAt: Date;
}
const schema = new Schema<IBankTransaction>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true }, utr: { type: String, required: true, trim: true, uppercase: true, maxlength: 35 }, amount: { type: Number, required: true, min: 0.01 }, date: { type: Date, required: true }, payerUpiId: { type: String, trim: true, lowercase: true, maxlength: 255 }, source: { type: String, enum: ["manual_import", "bank_api"], required: true }, sourceId: { type: String, trim: true, maxlength: 150 }, status: { type: String, enum: ["unmatched", "ambiguous", "matched", "ignored"], default: "unmatched", index: true }, matchedOrderId: { type: Schema.Types.ObjectId, ref: "PaymentOrder" }, candidateOrderIds: { type: [{ type: Schema.Types.ObjectId, ref: "PaymentOrder" }], default: [] }, importedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, importedAt: { type: Date, default: Date.now }
}, { timestamps: { createdAt: true, updatedAt: false } });
schema.pre("validate", async function () { const order = this.matchedOrderId ? await PaymentOrder.exists({ _id: this.matchedOrderId, schoolId: this.schoolId }) : null; if (this.matchedOrderId && !order) throw new Error("Matched payment order must belong to the same school"); });
schema.index({ schoolId: 1, utr: 1 }, { unique: true });
schema.index({ schoolId: 1, status: 1, date: -1 });
schema.index({ schoolId: 1, source: 1, sourceId: 1 }, { sparse: true });
export const BankTransaction = mongoose.model<IBankTransaction>("BankTransaction", schema);
