import mongoose, { Document, Schema, Types } from "mongoose";
import { LibraryBookStatus } from "@school-erp/shared";

export interface ILibraryBook extends Document {
  schoolId: Types.ObjectId;
  title: string;
  author: string;
  isbn?: string;
  category?: string;
  publisher?: string;
  edition?: string;
  publicationYear?: number;
  language?: string;
  shelfLocation?: string;
  description?: string;
  status: (typeof LibraryBookStatus)[keyof typeof LibraryBookStatus];
  createdAt: Date;
  updatedAt: Date;
}

const LibraryBookSchema = new Schema<ILibraryBook>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  author: { type: String, required: true, trim: true, maxlength: 150 },
  isbn: { type: String, trim: true, maxlength: 20 },
  category: { type: String, trim: true, maxlength: 80 },
  publisher: { type: String, trim: true, maxlength: 150 },
  edition: { type: String, trim: true, maxlength: 50 },
  publicationYear: { type: Number, min: 1000, max: 2100 },
  language: { type: String, trim: true, maxlength: 50 },
  shelfLocation: { type: String, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 2000 },
  status: { type: String, enum: Object.values(LibraryBookStatus), default: LibraryBookStatus.ACTIVE }
}, { timestamps: true });

LibraryBookSchema.index({ schoolId: 1, status: 1, createdAt: -1 });
LibraryBookSchema.index({ schoolId: 1, category: 1, status: 1 });
LibraryBookSchema.index({ schoolId: 1, isbn: 1 }, { partialFilterExpression: { isbn: { $exists: true } } });

export const LibraryBook = mongoose.model<ILibraryBook>("LibraryBook", LibraryBookSchema);
