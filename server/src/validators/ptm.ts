import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";
const iso=z.coerce.date();
export const CreatePTMSchema=z.object({title:z.string().trim().min(2).max(120),date:iso,startAt:iso,endAt:iso,classIds:z.array(ObjectIdSchema).min(1).max(100),teacherIds:z.array(ObjectIdSchema).min(1).max(200),slotMinutes:z.number().int().min(5).max(120).default(15)}).superRefine((v,c)=>{if(v.endAt<=v.startAt)c.addIssue({code:"custom",path:["endAt"],message:"End time must be after start time"});});
export const PTMQuerySchema=z.object({date:iso.optional(),status:z.enum(["draft","open","closed","cancelled"]).optional()});
export const BookPTMSchema=z.object({studentId:ObjectIdSchema,teacherId:ObjectIdSchema,startAt:iso});
export const PTMAppointmentUpdateSchema=z.object({status:z.enum(["cancelled","checked_in","completed"]).optional(),notes:z.string().max(2000).optional(),actionItems:z.array(z.object({text:z.string().trim().min(1).max(500),dueDate:iso.optional(),completed:z.boolean().default(false)})).max(20).optional()});