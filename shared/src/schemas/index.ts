import { z } from "zod";
import { UserRole, UserStatus, StudentStatus, TeacherStatus, AttendanceStatus, FeeType, FeeStatus, PaymentMode, Gender, BloodGroup, DocumentType } from "../constants";

export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");
export const SchoolCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,30}$/, "Invalid school code");
export const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").refine((value) => { const [year, month, day] = value.split("-").map(Number); const date = new Date(Date.UTC(year, month - 1, day)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day; }, "Invalid date");
export const PaginationSchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), sortBy: z.string().optional(), sortOrder: z.enum(["asc", "desc"]).default("desc") });
export const DateRangeSchema = z.object({ startDate: z.string().datetime().optional(), endDate: z.string().datetime().optional() });
export const PaginationParams = PaginationSchema;

const UserBaseSchema = z.object({ _id: ObjectIdSchema.optional(), email: z.string().email(), password: z.string().min(8).optional(), role: z.nativeEnum(UserRole), profileId: ObjectIdSchema.optional(), schoolId: ObjectIdSchema.optional(), isActive: z.boolean().default(true), lastLogin: z.string().datetime().optional(), createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional() });
const validateUserTenant = (value: { role: UserRole; schoolId?: string }, ctx: z.RefinementCtx) => { if (value.role === UserRole.SUPER_ADMIN && value.schoolId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["schoolId"], message: "Super admin must not belong to a school" }); if (value.role !== UserRole.SUPER_ADMIN && !value.schoolId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["schoolId"], message: "School is required for this user" }); };
export const UserSchema = UserBaseSchema.superRefine(validateUserTenant);
export const CreateUserSchema = UserBaseSchema.omit({ _id: true, createdAt: true, updatedAt: true, lastLogin: true }).extend({ password: z.string().min(8) }).superRefine(validateUserTenant);
export const UpdateUserSchema = UserBaseSchema.omit({ _id: true, createdAt: true, updatedAt: true, lastLogin: true, password: true }).partial();
export const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1), schoolCode: SchoolCodeSchema.optional() });
export const ChangePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) });
export const RefreshTokenSchema = z.object({ refreshToken: z.string() });
export const SchoolSchema = z.object({ _id: ObjectIdSchema.optional(), code: SchoolCodeSchema.optional(), name: z.string().min(2).max(100), logo: z.string().url().optional(), address: z.string().max(500), phone: z.string().max(20), email: z.string().email(), session: z.string().max(20), academicYear: ObjectIdSchema, settings: z.record(z.unknown()).default({}), createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional() });
export const CreateSchoolSchema = SchoolSchema.omit({ _id: true, code: true, createdAt: true, updatedAt: true });
export const UpdateSchoolSchema = CreateSchoolSchema.partial();
export const UpdateSchoolSettingsSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logo: z.string().url().nullable().optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  session: z.string().max(20).optional(),
  settings: z.record(z.unknown()).optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one school setting must be supplied");
export const AcademicYearSchema = z.object({ _id: ObjectIdSchema.optional(), name: z.string().max(20), startDate: z.string().datetime(), endDate: z.string().datetime(), isCurrent: z.boolean().default(false), createdAt: z.string().datetime().optional() });

const ParentIdsSchema = z.array(ObjectIdSchema).max(5).default([]);
export const StudentSchema = z.object({ _id: ObjectIdSchema.optional(), admissionNo: z.string().max(20), userId: ObjectIdSchema.optional(), parentIds: ParentIdsSchema, classId: ObjectIdSchema.optional(), sectionId: ObjectIdSchema.optional(), firstName: z.string().min(1).max(50), lastName: z.string().min(1).max(50), dob: DateOnlySchema, gender: z.nativeEnum(Gender), bloodGroup: z.nativeEnum(BloodGroup).optional(), religion: z.string().max(50).optional(), category: z.string().max(50).optional(), fatherName: z.string().max(100), motherName: z.string().max(100), phone: z.string().max(20), address: z.string().max(500), guardianPhone: z.string().max(20).optional(), previousSchool: z.string().max(100).optional(), transportId: ObjectIdSchema.optional(), documents: z.array(z.object({ type: z.nativeEnum(DocumentType), url: z.string().url(), publicId: z.string().max(300).optional(), uploadedAt: z.string().datetime() })).default([]), status: z.nativeEnum(StudentStatus).default(StudentStatus.ACTIVE), admissionDate: DateOnlySchema, createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional() });
export const CreateStudentSchema = StudentSchema.omit({ _id: true, createdAt: true, updatedAt: true, documents: true });
export const UpdateStudentSchema = CreateStudentSchema.partial();

export const TeacherSchema = z.object({ _id: ObjectIdSchema.optional(), employeeId: z.string().max(20), userId: ObjectIdSchema.optional(), firstName: z.string().min(1).max(50), lastName: z.string().max(50), email: z.string().email(), phone: z.string().max(20), qualification: z.string().max(200), experience: z.number().int().min(0).default(0), joiningDate: z.string().datetime(), salary: z.number().min(0).default(0), subjects: z.array(ObjectIdSchema).default([]), classTeacherOf: z.array(ObjectIdSchema).default([]), documents: z.array(z.object({ type: z.nativeEnum(DocumentType), url: z.string().url(), uploadedAt: z.string().datetime() })).default([]), status: z.nativeEnum(TeacherStatus).default(TeacherStatus.ACTIVE), createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional() });
export const CreateTeacherSchema = TeacherSchema.omit({ _id: true, createdAt: true, updatedAt: true, documents: true });
export const UpdateTeacherSchema = CreateTeacherSchema.partial();
export const ClassSchema = z.object({ _id: ObjectIdSchema.optional(), name: z.string().max(10), displayName: z.string().max(50), sectionIds: z.array(ObjectIdSchema).default([]), classTeacherId: ObjectIdSchema.optional(), roomNumber: z.string().max(20).optional(), capacity: z.number().int().positive().default(40), createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional() });
export const CreateClassSchema = ClassSchema.omit({ _id: true, createdAt: true, updatedAt: true, sectionIds: true });
export const UpdateClassSchema = CreateClassSchema.partial();
export const SectionSchema = z.object({ _id: ObjectIdSchema.optional(), name: z.string().max(10), classId: ObjectIdSchema, capacity: z.number().int().positive().default(40), createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional() });
export const CreateSectionSchema = SectionSchema.omit({ _id: true, createdAt: true, updatedAt: true });
export const UpdateSectionSchema = CreateSectionSchema.partial();
export const SubjectSchema = z.object({ _id: ObjectIdSchema.optional(), name: z.string().max(50), code: z.string().max(10), classIds: z.array(ObjectIdSchema).default([]), teacherId: ObjectIdSchema.optional(), createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional() });
export const CreateSubjectSchema = SubjectSchema.omit({ _id: true, createdAt: true, updatedAt: true });
export const UpdateSubjectSchema = CreateSubjectSchema.partial();
export const AttendanceSchema = z.object({ _id: ObjectIdSchema.optional(), date: z.string().datetime(), classId: ObjectIdSchema, sectionId: ObjectIdSchema, records: z.array(z.object({ studentId: ObjectIdSchema, status: z.nativeEnum(AttendanceStatus), remark: z.string().max(200).optional() })), markedBy: ObjectIdSchema, createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional() });
export const CreateAttendanceSchema = AttendanceSchema.omit({ _id: true, createdAt: true, updatedAt: true });
export const UpdateAttendanceSchema = CreateAttendanceSchema.partial();
export const MarkAttendanceSchema = z.object({ date: z.string().datetime(), classId: ObjectIdSchema, sectionId: ObjectIdSchema, records: z.array(z.object({ studentId: ObjectIdSchema, status: z.nativeEnum(AttendanceStatus), remark: z.string().max(200).optional() })) });
export const FeeStructureSchema = z.object({ _id: ObjectIdSchema.optional(), classId: ObjectIdSchema, feeType: z.nativeEnum(FeeType), amount: z.number().min(0), dueDate: z.string().datetime().optional(), academicYear: ObjectIdSchema, createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional() });
export const CreateFeeStructureSchema = FeeStructureSchema.omit({ _id: true, createdAt: true, updatedAt: true });
export const UpdateFeeStructureSchema = CreateFeeStructureSchema.partial();
export const FeeSchema = z.object({ _id: ObjectIdSchema.optional(), studentId: ObjectIdSchema, feeStructureId: ObjectIdSchema, amount: z.number().min(0), discount: z.number().min(0).default(0), fine: z.number().min(0).default(0), totalDue: z.number().min(0), paidAmount: z.number().min(0).default(0), balance: z.number().min(0), status: z.nativeEnum(FeeStatus).default(FeeStatus.PENDING), academicYear: ObjectIdSchema, createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional() });
export const CreateFeeSchema = FeeSchema.omit({ _id: true, createdAt: true, updatedAt: true });
export const UpdateFeeSchema = CreateFeeSchema.partial();
export const PaymentSchema = z.object({ _id: ObjectIdSchema.optional(), feeId: ObjectIdSchema, studentId: ObjectIdSchema, amount: z.number().positive(), mode: z.nativeEnum(PaymentMode), transactionId: z.string().trim().max(100).optional(), idempotencyKey: z.string().trim().min(8).max(100).optional(), receiptNo: z.string().max(20), collectedBy: ObjectIdSchema, date: z.string().datetime(), createdAt: z.string().datetime().optional() });
export const CreatePaymentSchema = PaymentSchema.omit({ _id: true, createdAt: true, receiptNo: true, collectedBy: true });
export const PaymentReversalSchema = z.object({ type: z.enum(["reversal", "refund"]), amount: z.number().positive(), reason: z.string().trim().min(3).max(500) });
export const AuditLogSchema = z.object({ _id: ObjectIdSchema.optional(), schoolId: ObjectIdSchema.optional(), userId: ObjectIdSchema, action: z.string(), entity: z.string(), entityId: ObjectIdSchema, before: z.record(z.unknown()).optional(), after: z.record(z.unknown()).optional(), ip: z.string().optional(), userAgent: z.string().optional(), createdAt: z.string().datetime().optional() });

export type User = z.infer<typeof UserSchema>; export type CreateUser = z.infer<typeof CreateUserSchema>; export type UpdateUser = z.infer<typeof UpdateUserSchema>; export type Login = z.infer<typeof LoginSchema>; export type School = z.infer<typeof SchoolSchema>; export type AcademicYear = z.infer<typeof AcademicYearSchema>; export type Student = z.infer<typeof StudentSchema>; export type CreateStudent = z.infer<typeof CreateStudentSchema>; export type UpdateStudent = z.infer<typeof UpdateStudentSchema>; export type Teacher = z.infer<typeof TeacherSchema>; export type CreateTeacher = z.infer<typeof CreateTeacherSchema>; export type UpdateTeacher = z.infer<typeof UpdateTeacherSchema>; export type Class = z.infer<typeof ClassSchema>; export type CreateClass = z.infer<typeof CreateClassSchema>; export type UpdateClass = z.infer<typeof UpdateClassSchema>; export type Section = z.infer<typeof SectionSchema>; export type CreateSection = z.infer<typeof CreateSectionSchema>; export type UpdateSection = z.infer<typeof UpdateSectionSchema>; export type Subject = z.infer<typeof SubjectSchema>; export type CreateSubject = z.infer<typeof CreateSubjectSchema>; export type Attendance = z.infer<typeof AttendanceSchema>; export type CreateAttendance = z.infer<typeof CreateAttendanceSchema>; export type UpdateAttendance = z.infer<typeof UpdateAttendanceSchema>; export type MarkAttendance = z.infer<typeof MarkAttendanceSchema>; export type FeeStructure = z.infer<typeof FeeStructureSchema>; export type Fee = z.infer<typeof FeeSchema>; export type Payment = z.infer<typeof PaymentSchema>; export type PaymentReversal = z.infer<typeof PaymentReversalSchema>; export type AuditLog = z.infer<typeof AuditLogSchema>; export type PaginationParams = z.infer<typeof PaginationSchema>;
