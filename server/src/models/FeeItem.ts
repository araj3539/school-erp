import mongoose, { Document, Schema, Types } from "mongoose";

export type FeeItemStatus = "pending" | "partial" | "paid" | "waived";

export interface IFeeItemAdjustment {
  type: "discount" | "waiver" | "surcharge" | "amount_override";
  amount: number;
  reason: string;
  actorId: Types.ObjectId;
  createdAt: Date;
}

export interface IFeeItem extends Document {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  feeId: Types.ObjectId;
  feeHeadId: Types.ObjectId;
  academicYear: Types.ObjectId;
  label: string;
  amount: number;
  discount: number;
  fine: number;
  totalDue: number;
  paidAmount: number;
  balance: number;
  status: FeeItemStatus;
  dueDate?: Date;
  adjustments: IFeeItemAdjustment[];
  createdAt: Date;
  updatedAt: Date;
}

const AdjustmentSchema = new Schema<IFeeItemAdjustment>({
  type: { type: String, enum: ["discount", "waiver", "surcharge", "amount_override"], required: true },
  amount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const FeeItemSchema = new Schema<IFeeItem>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  feeId: { type: Schema.Types.ObjectId, ref: "Fee", required: true },
  feeHeadId: { type: Schema.Types.ObjectId, ref: "FeeHead", required: true },
  academicYear: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  label: { type: String, required: true, trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, min: 0, default: 0 },
  fine: { type: Number, required: true, min: 0, default: 0 },
  totalDue: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, required: true, min: 0, default: 0 },
  balance: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["pending", "partial", "paid", "waived"], default: "pending" },
  dueDate: { type: Date },
  adjustments: { type: [AdjustmentSchema], default: [] }
}, { timestamps: true });

FeeItemSchema.pre("validate", function () {
  const expected = this.amount - this.discount + this.fine;
  if (expected < 0 || Math.abs(this.totalDue - expected) > 0.01) throw new mongoose.Error.ValidatorError({ path: "totalDue", message: "totalDue must equal amount - discount + fine" });
  const balance = this.totalDue - this.paidAmount;
  if (balance < 0 || Math.abs(this.balance - balance) > 0.01) throw new mongoose.Error.ValidatorError({ path: "balance", message: "balance must equal totalDue - paidAmount" });
});

FeeItemSchema.index({ schoolId: 1, studentId: 1, feeHeadId: 1, academicYear: 1 }, { unique: true });
FeeItemSchema.index({ schoolId: 1, feeId: 1 });
FeeItemSchema.index({ schoolId: 1, studentId: 1, academicYear: 1, status: 1 });

export const FeeItem = mongoose.model<IFeeItem>("FeeItem", FeeItemSchema);
