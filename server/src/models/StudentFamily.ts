import mongoose, { Document, Schema, Types } from "mongoose";

export type FamilyRelationship = "sibling" | "half_sibling";

export interface IStudentFamily extends Document {
  schoolId: Types.ObjectId;
  studentIds: Types.ObjectId[];
  relationship: FamilyRelationship;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StudentFamilySchema = new Schema<IStudentFamily>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  studentIds: {
    type: [{ type: Schema.Types.ObjectId, ref: "Student", required: true }],
    required: true,
    validate: [
      { validator: (ids: Types.ObjectId[]) => ids.length === 2, message: "A sibling relationship must contain exactly two students" },
      { validator: (ids: Types.ObjectId[]) => new Set(ids.map((id) => id.toString())).size === ids.length, message: "A student cannot be linked to itself or duplicated" }
    ]
  },
  relationship: { type: String, enum: ["sibling", "half_sibling"], default: "sibling" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

StudentFamilySchema.index({ schoolId: 1, studentIds: 1 }, { unique: true });

export const StudentFamily = mongoose.model<IStudentFamily>("StudentFamily", StudentFamilySchema);
