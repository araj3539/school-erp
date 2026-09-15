import { Document, Schema, Types, model } from "mongoose";

export type BehaviourKind = "incident" | "recognition";
export type BehaviourSeverity = "low" | "medium" | "high";
export type BehaviourStatus = "open" | "resolved" | "dismissed";

export interface IStudentBehaviour extends Document {
  schoolId: Types.ObjectId; studentId: Types.ObjectId; kind: BehaviourKind; category: string;
  severity: BehaviourSeverity; occurredAt: Date; description: string; actionTaken?: string;
  status: BehaviourStatus; parentAcknowledgedAt?: Date; parentAcknowledgedBy?: Types.ObjectId;
  resolvedAt?: Date; resolvedBy?: Types.ObjectId; createdBy: Types.ObjectId; updatedBy?: Types.ObjectId;
  createdAt: Date; updatedAt: Date;
}
const schema = new Schema<IStudentBehaviour>({
  schoolId:{type:Schema.Types.ObjectId,ref:"School",required:true}, studentId:{type:Schema.Types.ObjectId,ref:"Student",required:true},
  kind:{type:String,enum:["incident","recognition"],required:true}, category:{type:String,trim:true,minlength:2,maxlength:80,required:true},
  severity:{type:String,enum:["low","medium","high"],default:"low",required:true}, occurredAt:{type:Date,required:true},
  description:{type:String,trim:true,minlength:2,maxlength:3000,required:true}, actionTaken:{type:String,trim:true,maxlength:2000},
  status:{type:String,enum:["open","resolved","dismissed"],default:"open",required:true}, parentAcknowledgedAt:{type:Date},
  parentAcknowledgedBy:{type:Schema.Types.ObjectId,ref:"User"}, resolvedAt:{type:Date}, resolvedBy:{type:Schema.Types.ObjectId,ref:"User"},
  createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true}, updatedBy:{type:Schema.Types.ObjectId,ref:"User"}
},{timestamps:true});
schema.index({schoolId:1,studentId:1,occurredAt:-1}); schema.index({schoolId:1,status:1,occurredAt:-1}); schema.index({schoolId:1,kind:1,severity:1,occurredAt:-1});
export const StudentBehaviour=model<IStudentBehaviour>("StudentBehaviour",schema);
