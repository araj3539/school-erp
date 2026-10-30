import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";

export const ResultTemplateLayoutSchema = z.object({
  groupBySubject: z.boolean().default(true),
  showHeader: z.boolean().default(true),
  showStudentInfo: z.boolean().default(true),
  showRank: z.boolean().default(false),
  showPercentage: z.boolean().default(true),
  showGrade: z.boolean().default(true),
  showRemarks: z.boolean().default(false),
  showAttendance: z.boolean().default(false),
  subjectColumns: z.array(z.string()).default(["subject", "maxMarks", "obtainedMarks", "grade"]),
  footerText: z.string().max(500).default(""),
});

export const ResultTemplateBrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  headerText: z.string().max(200).optional(),
  footerText: z.string().max(500).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  schoolName: z.string().max(100).optional(),
  schoolAddress: z.string().max(500).optional(),
  schoolPhone: z.string().max(20).optional(),
  schoolEmail: z.string().email().optional(),
});

export const SignatureFieldSchema = z.object({
  label: z.string().trim().min(1).max(50),
  role: z.enum(["principal", "teacher", "accountant", "class_teacher"]),
});

export const CreateResultTemplateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  type: z.enum(["report_card", "mark_sheet", "transcript", "progress_report"]),
  layout: ResultTemplateLayoutSchema.optional(),
  branding: ResultTemplateBrandingSchema.optional(),
  gradingScale: ObjectIdSchema.optional(),
  signatureFields: z.array(SignatureFieldSchema).default([]),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const UpdateResultTemplateSchema = CreateResultTemplateSchema.partial();

export const ResultTemplateQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  type: z.enum(["report_card", "mark_sheet", "transcript", "progress_report"]).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  search: z.string().trim().max(100).optional(),
});

export const SetDefaultTemplateSchema = z.object({
  isDefault: z.boolean(),
});
