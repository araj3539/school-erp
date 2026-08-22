import { z } from "zod";
import {
  CreateUserSchema, UpdateUserSchema, LoginSchema, ChangePasswordSchema, RefreshTokenSchema,
  CreateSchoolSchema, UpdateSchoolSchema, CreateStudentSchema, UpdateStudentSchema,
  CreateTeacherSchema, UpdateTeacherSchema, CreateClassSchema, UpdateClassSchema,
  CreateSectionSchema, UpdateSectionSchema, CreateSubjectSchema, UpdateSubjectSchema,
  CreateAttendanceSchema, MarkAttendanceSchema, CreateFeeStructureSchema, CreateFeeSchema,
  CreatePaymentSchema, PaymentReversalSchema, PaginationSchema, DateRangeSchema, ObjectIdSchema, UserRole,
} from "@school-erp/shared";

export {
  CreateUserSchema, UpdateUserSchema, LoginSchema, ChangePasswordSchema, RefreshTokenSchema,
  CreateSchoolSchema, UpdateSchoolSchema, CreateStudentSchema, UpdateStudentSchema,
  CreateTeacherSchema, UpdateTeacherSchema, CreateClassSchema, UpdateClassSchema,
  CreateSectionSchema, UpdateSectionSchema, CreateSubjectSchema, UpdateSubjectSchema,
  CreateAttendanceSchema, MarkAttendanceSchema, CreateFeeStructureSchema, CreateFeeSchema,
  CreatePaymentSchema, PaymentReversalSchema, PaginationSchema, DateRangeSchema, ObjectIdSchema,
};

export const UpdateTenantUserSchema = UpdateUserSchema
  .omit({ schoolId: true })
  .superRefine((value, ctx) => {
    if (value.role === UserRole.SUPER_ADMIN) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["role"], message: "School users cannot be promoted to super admin" });
    }
  });

export const IdParamSchema = z.object({ id: ObjectIdSchema });
export const StudentDocumentParamSchema = z.object({ id: ObjectIdSchema, documentId: ObjectIdSchema });
export type IdParams = z.infer<typeof IdParamSchema>;
export type StudentDocumentParams = z.infer<typeof StudentDocumentParamSchema>;

export const FeeQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), sortBy: z.string().optional(), sortOrder: z.enum(["asc", "desc"]).default("desc"), studentId: z.string().optional(), status: z.string().optional(), classId: z.string().optional(), academicYear: z.string().optional(), search: z.string().optional() });
export const StudentQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), sortBy: z.string().optional(), sortOrder: z.enum(["asc", "desc"]).default("desc"), classId: z.string().optional(), sectionId: z.string().optional(), status: z.string().optional(), search: z.string().optional() });
export const TeacherQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), sortBy: z.string().optional(), sortOrder: z.enum(["asc", "desc"]).default("desc"), status: z.string().optional(), search: z.string().optional() });
export const ClassQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), sortBy: z.string().optional(), sortOrder: z.enum(["asc", "desc"]).default("desc") });
export const SectionQuerySchema = z.object({ classId: z.string().optional() });
export const SubjectQuerySchema = z.object({ classId: z.string().optional() });
export const AttendanceQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), sortBy: z.string().optional(), sortOrder: z.enum(["asc", "desc"]).default("desc"), classId: z.string().optional(), sectionId: z.string().optional(), date: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() });
export const PaymentQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), sortBy: z.string().optional(), sortOrder: z.enum(["asc", "desc"]).default("desc"), studentId: z.string().optional(), feeId: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() });
export const UserQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), sortBy: z.string().optional(), sortOrder: z.enum(["asc", "desc"]).default("desc"), role: z.string().optional(), isActive: z.string().optional() });
export const DateRangeQuerySchema = z.object({ startDate: z.string().optional(), endDate: z.string().optional() });
export const ReportQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), search: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() });