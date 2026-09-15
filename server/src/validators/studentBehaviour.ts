import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";
const date=z.coerce.date();
export const CreateStudentBehaviourSchema=z.object({studentId:ObjectIdSchema,kind:z.enum(["incident","recognition"]),category:z.string().trim().min(2).max(80),severity:z.enum(["low","medium","high"]).default("low"),occurredAt:date,description:z.string().trim().min(2).max(3000),actionTaken:z.string().trim().max(2000).optional()});
export const StudentBehaviourQuerySchema=z.object({studentId:ObjectIdSchema.optional(),kind:z.enum(["incident","recognition"]).optional(),status:z.enum(["open","resolved","dismissed"]).optional(),from:date.optional(),to:date.optional(),limit:z.coerce.number().int().min(1).max(100).default(50)}).superRefine((v,c)=>{if(v.from&&v.to&&v.from>v.to)c.addIssue({code:"custom",path:["to"],message:"to must be on or after from"});});
export const UpdateStudentBehaviourSchema=z.object({status:z.enum(["open","resolved","dismissed"]).optional(),actionTaken:z.string().trim().max(2000).optional()}).refine(v=>v.status||v.actionTaken!==undefined,{message:"At least one field is required"});
