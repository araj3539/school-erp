import mongoose, { Document, Schema, Types } from "mongoose";
import { LibraryCopyStatus } from "@school-erp/shared";

export interface ILibraryCopy extends Document {
  schoolId: Types.ObjectId;
  bookId: Types.ObjectId;
  accessionNo: string;
  status: (typeof LibraryCopyStatus)[keyof typeof LibraryCopyStatus];
  conditionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LibraryCopySchema = new Schema<ILibraryCopy>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  bookId: { type: Schema.Types.ObjectId, ref: "LibraryBook", required: true },
  accessionNo: { type: String, required: true, trim: true, maxlength: 30 },
  status: { type: String, enum: Object.values(LibraryCopyStatus), default: LibraryCopyStatus.AVAILABLE },
  conditionNote: { type: String, trim: true, maxlength: 500 }
}, { timestamps: true });

LibraryCopySchema.index({ schoolId: 1, accessionNo: 1 }, { unique: true });
LibraryCopySchema.index({ schoolId: 1, bookId: 1, status: 1 });
LibraryCopySchema.index({ schoolId: 1, status: 1, updatedAt: -1 });

export const LibraryCopy = mongoose.model<ILibraryCopy>("LibraryCopy", LibraryCopySchema);
