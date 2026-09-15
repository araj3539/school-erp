import { z } from "zod";

export const AdmissionStageSchema = z.enum(["enquiry", "contacted", "visit", "application", "documents", "assessment", "accepted", "rejected", "converted"]);
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const AdmissionEnquiryCreateSchema = z.object({
  studentName: z.string().trim().min(2).max(150),
  guardianName: z.string().trim().min(2).max(150),
  phone: optionalText(30),
  email: z.string().trim().email().max(254).optional(),
  source: optionalText(80),
  stage: AdmissionStageSchema.default("enquiry"),
  classId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  followUpAt: z.coerce.date().optional(),
  notes: optionalText(3000)
});

export const AdmissionEnquiryUpdateSchema = AdmissionEnquiryCreateSchema.partial().extend({ convertedStudentId: z.string().regex(/^[a-f\d]{24}$/i).optional() });
export const AdmissionEnquiryQuerySchema = z.object({ stage: AdmissionStageSchema.optional(), search: z.string().trim().max(100).optional() });
