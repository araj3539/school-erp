import { z } from "zod";
import {
  CreateUserSchema,
  UpdateUserSchema,
  LoginSchema,
  ChangePasswordSchema,
  RefreshTokenSchema,
  CreateSchoolSchema,
  UpdateSchoolSchema,
  CreateStudentSchema,
  UpdateStudentSchema,
  CreateTeacherSchema,
  UpdateTeacherSchema,
  CreateClassSchema,
  UpdateClassSchema,
  CreateSectionSchema,
  UpdateSectionSchema,
  CreateSubjectSchema,
  UpdateSubjectSchema,
  CreateAttendanceSchema,
  MarkAttendanceSchema,
  CreateFeeStructureSchema,
  CreateFeeSchema,
  CreatePaymentSchema,
  PaginationSchema,
  DateRangeSchema,
  ObjectIdSchema,
} from "@school-erp/shared";

export {
  CreateUserSchema,
  UpdateUserSchema,
  LoginSchema,
  ChangePasswordSchema,
  RefreshTokenSchema,
  CreateSchoolSchema,
  UpdateSchoolSchema,
  CreateStudentSchema,
  UpdateStudentSchema,
  CreateTeacherSchema,
  UpdateTeacherSchema,
  CreateClassSchema,
  UpdateClassSchema,
  CreateSectionSchema,
  UpdateSectionSchema,
  CreateSubjectSchema,
  UpdateSubjectSchema,
  CreateAttendanceSchema,
  MarkAttendanceSchema,
  CreateFeeStructureSchema,
  CreateFeeSchema,
  CreatePaymentSchema,
  PaginationSchema,
  DateRangeSchema,
  ObjectIdSchema,
};

export const IdParamSchema = z.object({ id: ObjectIdSchema });
export const StudentDocumentParamSchema = z.object({ id: ObjectIdSchema, documentId: ObjectIdSchema });

export type IdParams = z.infer<typeof IdParamSchema>;
export type StudentDocumentParams = z.infer<typeof StudentDocumentParamSchema>;

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
  search: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  status: z.string().optional(),
});
