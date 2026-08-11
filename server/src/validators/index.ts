import { z } from "zod";
import * as sharedSchemas from "../shared-types";

export const CreateUserSchema = sharedSchemas.CreateUserSchema;
export const UpdateUserSchema = sharedSchemas.UpdateUserSchema;
export const LoginSchema = sharedSchemas.LoginSchema;
export const ChangePasswordSchema = sharedSchemas.ChangePasswordSchema;
export const RefreshTokenSchema = sharedSchemas.RefreshTokenSchema;
export const CreateSchoolSchema = sharedSchemas.CreateSchoolSchema;
export const UpdateSchoolSchema = sharedSchemas.UpdateSchoolSchema;
export const CreateStudentSchema = sharedSchemas.CreateStudentSchema;
export const UpdateStudentSchema = sharedSchemas.UpdateStudentSchema;
export const CreateTeacherSchema = sharedSchemas.CreateTeacherSchema;
export const UpdateTeacherSchema = sharedSchemas.UpdateTeacherSchema;
export const CreateClassSchema = sharedSchemas.CreateClassSchema;
export const UpdateClassSchema = sharedSchemas.UpdateClassSchema;
export const CreateSectionSchema = sharedSchemas.CreateSectionSchema;
export const UpdateSectionSchema = sharedSchemas.UpdateSectionSchema;
export const CreateSubjectSchema = sharedSchemas.CreateSubjectSchema;
export const UpdateSubjectSchema = sharedSchemas.UpdateSubjectSchema;
export const CreateAttendanceSchema = sharedSchemas.CreateAttendanceSchema;
export const MarkAttendanceSchema = sharedSchemas.MarkAttendanceSchema;
export const CreateFeeStructureSchema = sharedSchemas.CreateFeeStructureSchema;
export const CreateFeeSchema = sharedSchemas.CreateFeeSchema;
export const CreatePaymentSchema = sharedSchemas.CreatePaymentSchema;
export const PaginationSchema = sharedSchemas.PaginationSchema;
export const DateRangeSchema = sharedSchemas.DateRangeSchema;
export const ObjectIdSchema = sharedSchemas.ObjectIdSchema;

// Param validation schemas
export const IdParamSchema = z.object({ id: sharedSchemas.ObjectIdSchema });

// Helper type for parsed params
export type IdParams = z.infer<typeof IdParamSchema>;

// Query schemas with proper types
export const FeeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  studentId: z.string().optional(),
  status: z.string().optional(),
  classId: z.string().optional(),
  academicYear: z.string().optional(),
  search: z.string().optional(),
});

export const StudentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export const TeacherQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  status: z.string().optional(),
  search: z.string().optional(),
});

export const ClassQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const SectionQuerySchema = z.object({
  classId: z.string().optional(),
});

export const SubjectQuerySchema = z.object({
  classId: z.string().optional(),
});

export const AttendanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const PaymentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  studentId: z.string().optional(),
  feeId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const UserQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  role: z.string().optional(),
  isActive: z.string().optional(),
});

export const DateRangeQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const ReportQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});