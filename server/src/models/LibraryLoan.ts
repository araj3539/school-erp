import mongoose, { Document, Schema, Types } from "mongoose";
import { LibraryBorrowerType, LibraryLoanStatus } from "@school-erp/shared";

export interface ILibraryLoan extends Document {
  schoolId: Types.ObjectId;
  copyId: Types.ObjectId;
  borrowerType: (typeof LibraryBorrowerType)[keyof typeof LibraryBorrowerType];
  borrowerId: Types.ObjectId;
  issuedAt: Date;
  dueAt: Date;
  returnedAt?: Date;
  dailyFineRate: number;
  fineAmount: number;
  status: (typeof LibraryLoanStatus)[keyof typeof LibraryLoanStatus];
  notes?: string;
  issuedBy: Types.ObjectId;
  returnedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LibraryLoanSchema = new Schema<ILibraryLoan>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  copyId: { type: Schema.Types.ObjectId, ref: "LibraryCopy", required: true },
  borrowerType: { type: String, enum: Object.values(LibraryBorrowerType), required: true },
  borrowerId: { type: Schema.Types.ObjectId, required: true },
  issuedAt: { type: Date, required: true, default: Date.now },
  dueAt: { type: Date, required: true },
  returnedAt: { type: Date },
  dailyFineRate: { type: Number, required: true, min: 0 },
  fineAmount: { type: Number, required: true, min: 0, default: 0 },
  status: { type: String, enum: Object.values(LibraryLoanStatus), required: true, default: LibraryLoanStatus.ACTIVE },
  notes: { type: String, trim: true, maxlength: 500 },
  issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  returnedBy: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

LibraryLoanSchema.index({ schoolId: 1, copyId: 1, status: 1 });
LibraryLoanSchema.index({ schoolId: 1, borrowerType: 1, borrowerId: 1, status: 1 });
LibraryLoanSchema.index({ schoolId: 1, dueAt: 1, status: 1 });
LibraryLoanSchema.index(
  { schoolId: 1, copyId: 1, activeLoan: 1 },
  { unique: true, partialFilterExpression: { activeLoan: true } }
);

LibraryLoanSchema.virtual("activeLoan").get(function () {
  return this.status === LibraryLoanStatus.ACTIVE;
});
LibraryLoanSchema.set("toJSON", { virtuals: true });
LibraryLoanSchema.set("toObject", { virtuals: true });

export const LibraryLoan = mongoose.model<ILibraryLoan>("LibraryLoan", LibraryLoanSchema);
