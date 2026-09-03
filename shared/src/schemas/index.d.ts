import { z } from "zod";
import { UserRole, StudentStatus, TeacherStatus, AttendanceStatus, FeeType, FeeStatus, PaymentMode, Gender, BloodGroup, DocumentType } from "../constants/index.js";
export declare const ObjectIdSchema: z.ZodString;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const DateRangeSchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export declare const UserSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    email: z.ZodString;
    password: z.ZodOptional<z.ZodString>;
    role: z.ZodNativeEnum<typeof UserRole>;
    profileId: z.ZodOptional<z.ZodString>;
    schoolId: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    lastLogin: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    role: UserRole;
    schoolId: string;
    isActive: boolean;
    _id?: string | undefined;
    password?: string | undefined;
    profileId?: string | undefined;
    lastLogin?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}, {
    email: string;
    role: UserRole;
    schoolId: string;
    _id?: string | undefined;
    password?: string | undefined;
    profileId?: string | undefined;
    isActive?: boolean | undefined;
    lastLogin?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}>;
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    profileId: z.ZodOptional<z.ZodString>;
    schoolId: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
} & {
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    role: UserRole;
    schoolId: string;
    isActive: boolean;
    profileId?: string | undefined;
}, {
    email: string;
    password: string;
    role: UserRole;
    schoolId: string;
    profileId?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const UpdateUserSchema: z.ZodObject<Omit<{
    email: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodNativeEnum<typeof UserRole>>;
    profileId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    schoolId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    password: z.ZodOptional<z.ZodString>;
}, "password">, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    role?: UserRole | undefined;
    profileId?: string | undefined;
    schoolId?: string | undefined;
    isActive?: boolean | undefined;
}, {
    email?: string | undefined;
    role?: UserRole | undefined;
    profileId?: string | undefined;
    schoolId?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const ChangePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export declare const RefreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const SchoolSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    logo: z.ZodOptional<z.ZodString>;
    address: z.ZodString;
    phone: z.ZodString;
    email: z.ZodString;
    session: z.ZodString;
    academicYear: z.ZodString;
    settings: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    address: string;
    phone: string;
    session: string;
    academicYear: string;
    settings: Record<string, unknown>;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    logo?: string | undefined;
}, {
    email: string;
    name: string;
    address: string;
    phone: string;
    session: string;
    academicYear: string;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    logo?: string | undefined;
    settings?: Record<string, unknown> | undefined;
}>;
export declare const CreateSchoolSchema: z.ZodObject<Omit<{
    _id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    logo: z.ZodOptional<z.ZodString>;
    address: z.ZodString;
    phone: z.ZodString;
    email: z.ZodString;
    session: z.ZodString;
    academicYear: z.ZodString;
    settings: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "_id" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    address: string;
    phone: string;
    session: string;
    academicYear: string;
    settings: Record<string, unknown>;
    logo?: string | undefined;
}, {
    email: string;
    name: string;
    address: string;
    phone: string;
    session: string;
    academicYear: string;
    logo?: string | undefined;
    settings?: Record<string, unknown> | undefined;
}>;
export declare const UpdateSchoolSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    logo: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    session: z.ZodOptional<z.ZodString>;
    academicYear: z.ZodOptional<z.ZodString>;
    settings: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    name?: string | undefined;
    logo?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    session?: string | undefined;
    academicYear?: string | undefined;
    settings?: Record<string, unknown> | undefined;
}, {
    email?: string | undefined;
    name?: string | undefined;
    logo?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    session?: string | undefined;
    academicYear?: string | undefined;
    settings?: Record<string, unknown> | undefined;
}>;
export declare const AcademicYearSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    isCurrent: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    name: string;
    isCurrent: boolean;
    _id?: string | undefined;
    createdAt?: string | undefined;
}, {
    startDate: string;
    endDate: string;
    name: string;
    _id?: string | undefined;
    createdAt?: string | undefined;
    isCurrent?: boolean | undefined;
}>;
export declare const StudentSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    admissionNo: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    classId: z.ZodOptional<z.ZodString>;
    sectionId: z.ZodOptional<z.ZodString>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    dob: z.ZodString;
    gender: z.ZodNativeEnum<typeof Gender>;
    bloodGroup: z.ZodOptional<z.ZodNativeEnum<typeof BloodGroup>>;
    religion: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    fatherName: z.ZodString;
    motherName: z.ZodString;
    phone: z.ZodString;
    address: z.ZodString;
    guardianPhone: z.ZodOptional<z.ZodString>;
    previousSchool: z.ZodOptional<z.ZodString>;
    transportId: z.ZodOptional<z.ZodString>;
    documents: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodNativeEnum<typeof DocumentType>;
        url: z.ZodString;
        uploadedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: DocumentType;
        url: string;
        uploadedAt: string;
    }, {
        type: DocumentType;
        url: string;
        uploadedAt: string;
    }>, "many">>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof StudentStatus>>;
    admissionDate: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: StudentStatus;
    address: string;
    phone: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    dob: string;
    gender: Gender;
    fatherName: string;
    motherName: string;
    documents: {
        type: DocumentType;
        url: string;
        uploadedAt: string;
    }[];
    admissionDate: string;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    userId?: string | undefined;
    classId?: string | undefined;
    sectionId?: string | undefined;
    bloodGroup?: BloodGroup | undefined;
    religion?: string | undefined;
    category?: string | undefined;
    guardianPhone?: string | undefined;
    previousSchool?: string | undefined;
    transportId?: string | undefined;
}, {
    address: string;
    phone: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    dob: string;
    gender: Gender;
    fatherName: string;
    motherName: string;
    admissionDate: string;
    status?: StudentStatus | undefined;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    userId?: string | undefined;
    classId?: string | undefined;
    sectionId?: string | undefined;
    bloodGroup?: BloodGroup | undefined;
    religion?: string | undefined;
    category?: string | undefined;
    guardianPhone?: string | undefined;
    previousSchool?: string | undefined;
    transportId?: string | undefined;
    documents?: {
        type: DocumentType;
        url: string;
        uploadedAt: string;
    }[] | undefined;
}>;
export declare const CreateStudentSchema: z.ZodObject<Omit<{
    _id: z.ZodOptional<z.ZodString>;
    admissionNo: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    classId: z.ZodOptional<z.ZodString>;
    sectionId: z.ZodOptional<z.ZodString>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    dob: z.ZodString;
    gender: z.ZodNativeEnum<typeof Gender>;
    bloodGroup: z.ZodOptional<z.ZodNativeEnum<typeof BloodGroup>>;
    religion: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    fatherName: z.ZodString;
    motherName: z.ZodString;
    phone: z.ZodString;
    address: z.ZodString;
    guardianPhone: z.ZodOptional<z.ZodString>;
    previousSchool: z.ZodOptional<z.ZodString>;
    transportId: z.ZodOptional<z.ZodString>;
    documents: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodNativeEnum<typeof DocumentType>;
        url: z.ZodString;
        uploadedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: DocumentType;
        url: string;
        uploadedAt: string;
    }, {
        type: DocumentType;
        url: string;
        uploadedAt: string;
    }>, "many">>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof StudentStatus>>;
    admissionDate: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "_id" | "createdAt" | "updatedAt" | "documents">, "strip", z.ZodTypeAny, {
    status: StudentStatus;
    address: string;
    phone: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    dob: string;
    gender: Gender;
    fatherName: string;
    motherName: string;
    admissionDate: string;
    userId?: string | undefined;
    classId?: string | undefined;
    sectionId?: string | undefined;
    bloodGroup?: BloodGroup | undefined;
    religion?: string | undefined;
    category?: string | undefined;
    guardianPhone?: string | undefined;
    previousSchool?: string | undefined;
    transportId?: string | undefined;
}, {
    address: string;
    phone: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    dob: string;
    gender: Gender;
    fatherName: string;
    motherName: string;
    admissionDate: string;
    status?: StudentStatus | undefined;
    userId?: string | undefined;
    classId?: string | undefined;
    sectionId?: string | undefined;
    bloodGroup?: BloodGroup | undefined;
    religion?: string | undefined;
    category?: string | undefined;
    guardianPhone?: string | undefined;
    previousSchool?: string | undefined;
    transportId?: string | undefined;
}>;
export declare const UpdateStudentSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof StudentStatus>>>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    admissionNo: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    classId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sectionId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    dob: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodNativeEnum<typeof Gender>>;
    bloodGroup: z.ZodOptional<z.ZodOptional<z.ZodNativeEnum<typeof BloodGroup>>>;
    religion: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fatherName: z.ZodOptional<z.ZodString>;
    motherName: z.ZodOptional<z.ZodString>;
    guardianPhone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    previousSchool: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    transportId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    admissionDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: StudentStatus | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    admissionNo?: string | undefined;
    userId?: string | undefined;
    classId?: string | undefined;
    sectionId?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    dob?: string | undefined;
    gender?: Gender | undefined;
    bloodGroup?: BloodGroup | undefined;
    religion?: string | undefined;
    category?: string | undefined;
    fatherName?: string | undefined;
    motherName?: string | undefined;
    guardianPhone?: string | undefined;
    previousSchool?: string | undefined;
    transportId?: string | undefined;
    admissionDate?: string | undefined;
}, {
    status?: StudentStatus | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    admissionNo?: string | undefined;
    userId?: string | undefined;
    classId?: string | undefined;
    sectionId?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    dob?: string | undefined;
    gender?: Gender | undefined;
    bloodGroup?: BloodGroup | undefined;
    religion?: string | undefined;
    category?: string | undefined;
    fatherName?: string | undefined;
    motherName?: string | undefined;
    guardianPhone?: string | undefined;
    previousSchool?: string | undefined;
    transportId?: string | undefined;
    admissionDate?: string | undefined;
}>;
export declare const TeacherSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    employeeId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    qualification: z.ZodString;
    experience: z.ZodDefault<z.ZodNumber>;
    joiningDate: z.ZodString;
    salary: z.ZodDefault<z.ZodNumber>;
    subjects: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    classTeacherOf: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    documents: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodNativeEnum<typeof DocumentType>;
        url: z.ZodString;
        uploadedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: DocumentType;
        url: string;
        uploadedAt: string;
    }, {
        type: DocumentType;
        url: string;
        uploadedAt: string;
    }>, "many">>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof TeacherStatus>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: TeacherStatus;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    documents: {
        type: DocumentType;
        url: string;
        uploadedAt: string;
    }[];
    employeeId: string;
    qualification: string;
    experience: number;
    joiningDate: string;
    salary: number;
    subjects: string[];
    classTeacherOf: string[];
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    userId?: string | undefined;
}, {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    qualification: string;
    joiningDate: string;
    status?: TeacherStatus | undefined;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    userId?: string | undefined;
    documents?: {
        type: DocumentType;
        url: string;
        uploadedAt: string;
    }[] | undefined;
    experience?: number | undefined;
    salary?: number | undefined;
    subjects?: string[] | undefined;
    classTeacherOf?: string[] | undefined;
}>;
export declare const CreateTeacherSchema: z.ZodObject<Omit<{
    _id: z.ZodOptional<z.ZodString>;
    employeeId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    qualification: z.ZodString;
    experience: z.ZodDefault<z.ZodNumber>;
    joiningDate: z.ZodString;
    salary: z.ZodDefault<z.ZodNumber>;
    subjects: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    classTeacherOf: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    documents: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodNativeEnum<typeof DocumentType>;
        url: z.ZodString;
        uploadedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: DocumentType;
        url: string;
        uploadedAt: string;
    }, {
        type: DocumentType;
        url: string;
        uploadedAt: string;
    }>, "many">>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof TeacherStatus>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "_id" | "createdAt" | "updatedAt" | "documents">, "strip", z.ZodTypeAny, {
    status: TeacherStatus;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    qualification: string;
    experience: number;
    joiningDate: string;
    salary: number;
    subjects: string[];
    classTeacherOf: string[];
    userId?: string | undefined;
}, {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    qualification: string;
    joiningDate: string;
    status?: TeacherStatus | undefined;
    userId?: string | undefined;
    experience?: number | undefined;
    salary?: number | undefined;
    subjects?: string[] | undefined;
    classTeacherOf?: string[] | undefined;
}>;
export declare const UpdateTeacherSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof TeacherStatus>>>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    employeeId: z.ZodOptional<z.ZodString>;
    qualification: z.ZodOptional<z.ZodString>;
    experience: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    joiningDate: z.ZodOptional<z.ZodString>;
    salary: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    subjects: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    classTeacherOf: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    status?: TeacherStatus | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    userId?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    employeeId?: string | undefined;
    qualification?: string | undefined;
    experience?: number | undefined;
    joiningDate?: string | undefined;
    salary?: number | undefined;
    subjects?: string[] | undefined;
    classTeacherOf?: string[] | undefined;
}, {
    status?: TeacherStatus | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    userId?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    employeeId?: string | undefined;
    qualification?: string | undefined;
    experience?: number | undefined;
    joiningDate?: string | undefined;
    salary?: number | undefined;
    subjects?: string[] | undefined;
    classTeacherOf?: string[] | undefined;
}>;
export declare const ClassSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    displayName: z.ZodString;
    sectionIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    classTeacherId: z.ZodOptional<z.ZodString>;
    roomNumber: z.ZodOptional<z.ZodString>;
    capacity: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    displayName: string;
    sectionIds: string[];
    capacity: number;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    classTeacherId?: string | undefined;
    roomNumber?: string | undefined;
}, {
    name: string;
    displayName: string;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    sectionIds?: string[] | undefined;
    classTeacherId?: string | undefined;
    roomNumber?: string | undefined;
    capacity?: number | undefined;
}>;
export declare const CreateClassSchema: z.ZodObject<Omit<{
    _id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    displayName: z.ZodString;
    sectionIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    classTeacherId: z.ZodOptional<z.ZodString>;
    roomNumber: z.ZodOptional<z.ZodString>;
    capacity: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "_id" | "createdAt" | "updatedAt" | "sectionIds">, "strip", z.ZodTypeAny, {
    name: string;
    displayName: string;
    capacity: number;
    classTeacherId?: string | undefined;
    roomNumber?: string | undefined;
}, {
    name: string;
    displayName: string;
    classTeacherId?: string | undefined;
    roomNumber?: string | undefined;
    capacity?: number | undefined;
}>;
export declare const UpdateClassSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodString>;
    classTeacherId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    roomNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    capacity: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    displayName?: string | undefined;
    classTeacherId?: string | undefined;
    roomNumber?: string | undefined;
    capacity?: number | undefined;
}, {
    name?: string | undefined;
    displayName?: string | undefined;
    classTeacherId?: string | undefined;
    roomNumber?: string | undefined;
    capacity?: number | undefined;
}>;
export declare const SectionSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    classId: z.ZodString;
    capacity: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    classId: string;
    capacity: number;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}, {
    name: string;
    classId: string;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    capacity?: number | undefined;
}>;
export declare const CreateSectionSchema: z.ZodObject<Omit<{
    _id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    classId: z.ZodString;
    capacity: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "_id" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    name: string;
    classId: string;
    capacity: number;
}, {
    name: string;
    classId: string;
    capacity?: number | undefined;
}>;
export declare const UpdateSectionSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    classId: z.ZodOptional<z.ZodString>;
    capacity: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    classId?: string | undefined;
    capacity?: number | undefined;
}, {
    name?: string | undefined;
    classId?: string | undefined;
    capacity?: number | undefined;
}>;
export declare const SubjectSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    code: z.ZodString;
    classIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    teacherId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    classIds: string[];
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    teacherId?: string | undefined;
}, {
    code: string;
    name: string;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    classIds?: string[] | undefined;
    teacherId?: string | undefined;
}>;
export declare const CreateSubjectSchema: z.ZodObject<Omit<{
    _id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    code: z.ZodString;
    classIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    teacherId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "_id" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    classIds: string[];
    teacherId?: string | undefined;
}, {
    code: string;
    name: string;
    classIds?: string[] | undefined;
    teacherId?: string | undefined;
}>;
export declare const UpdateSubjectSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    classIds: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    teacherId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    name?: string | undefined;
    classIds?: string[] | undefined;
    teacherId?: string | undefined;
}, {
    code?: string | undefined;
    name?: string | undefined;
    classIds?: string[] | undefined;
    teacherId?: string | undefined;
}>;
export declare const AttendanceSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    date: z.ZodString;
    classId: z.ZodString;
    sectionId: z.ZodString;
    records: z.ZodArray<z.ZodObject<{
        studentId: z.ZodString;
        status: z.ZodNativeEnum<typeof AttendanceStatus>;
        remark: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }, {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }>, "many">;
    markedBy: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    date: string;
    classId: string;
    sectionId: string;
    records: {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }[];
    markedBy: string;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}, {
    date: string;
    classId: string;
    sectionId: string;
    records: {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }[];
    markedBy: string;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}>;
export declare const CreateAttendanceSchema: z.ZodObject<Omit<{
    _id: z.ZodOptional<z.ZodString>;
    date: z.ZodString;
    classId: z.ZodString;
    sectionId: z.ZodString;
    records: z.ZodArray<z.ZodObject<{
        studentId: z.ZodString;
        status: z.ZodNativeEnum<typeof AttendanceStatus>;
        remark: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }, {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }>, "many">;
    markedBy: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "_id" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    date: string;
    classId: string;
    sectionId: string;
    records: {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }[];
    markedBy: string;
}, {
    date: string;
    classId: string;
    sectionId: string;
    records: {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }[];
    markedBy: string;
}>;
export declare const UpdateAttendanceSchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodString>;
    classId: z.ZodOptional<z.ZodString>;
    sectionId: z.ZodOptional<z.ZodString>;
    records: z.ZodOptional<z.ZodArray<z.ZodObject<{
        studentId: z.ZodString;
        status: z.ZodNativeEnum<typeof AttendanceStatus>;
        remark: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }, {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }>, "many">>;
    markedBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    date?: string | undefined;
    classId?: string | undefined;
    sectionId?: string | undefined;
    records?: {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }[] | undefined;
    markedBy?: string | undefined;
}, {
    date?: string | undefined;
    classId?: string | undefined;
    sectionId?: string | undefined;
    records?: {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }[] | undefined;
    markedBy?: string | undefined;
}>;
export declare const MarkAttendanceSchema: z.ZodObject<{
    date: z.ZodString;
    classId: z.ZodString;
    sectionId: z.ZodString;
    records: z.ZodArray<z.ZodObject<{
        studentId: z.ZodString;
        status: z.ZodNativeEnum<typeof AttendanceStatus>;
        remark: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }, {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    date: string;
    classId: string;
    sectionId: string;
    records: {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }[];
}, {
    date: string;
    classId: string;
    sectionId: string;
    records: {
        status: AttendanceStatus;
        studentId: string;
        remark?: string | undefined;
    }[];
}>;
export declare const FeeStructureSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    classId: z.ZodString;
    feeType: z.ZodNativeEnum<typeof FeeType>;
    amount: z.ZodNumber;
    dueDate: z.ZodOptional<z.ZodString>;
    academicYear: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    academicYear: string;
    classId: string;
    feeType: FeeType;
    amount: number;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    dueDate?: string | undefined;
}, {
    academicYear: string;
    classId: string;
    feeType: FeeType;
    amount: number;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    dueDate?: string | undefined;
}>;
export declare const CreateFeeStructureSchema: z.ZodObject<Omit<{
    _id: z.ZodOptional<z.ZodString>;
    classId: z.ZodString;
    feeType: z.ZodNativeEnum<typeof FeeType>;
    amount: z.ZodNumber;
    dueDate: z.ZodOptional<z.ZodString>;
    academicYear: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "_id" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    academicYear: string;
    classId: string;
    feeType: FeeType;
    amount: number;
    dueDate?: string | undefined;
}, {
    academicYear: string;
    classId: string;
    feeType: FeeType;
    amount: number;
    dueDate?: string | undefined;
}>;
export declare const UpdateFeeStructureSchema: z.ZodObject<{
    academicYear: z.ZodOptional<z.ZodString>;
    classId: z.ZodOptional<z.ZodString>;
    feeType: z.ZodOptional<z.ZodNativeEnum<typeof FeeType>>;
    amount: z.ZodOptional<z.ZodNumber>;
    dueDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    academicYear?: string | undefined;
    classId?: string | undefined;
    feeType?: FeeType | undefined;
    amount?: number | undefined;
    dueDate?: string | undefined;
}, {
    academicYear?: string | undefined;
    classId?: string | undefined;
    feeType?: FeeType | undefined;
    amount?: number | undefined;
    dueDate?: string | undefined;
}>;
export declare const FeeSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    studentId: z.ZodString;
    feeStructureId: z.ZodString;
    amount: z.ZodNumber;
    discount: z.ZodDefault<z.ZodNumber>;
    fine: z.ZodDefault<z.ZodNumber>;
    totalDue: z.ZodNumber;
    paidAmount: z.ZodDefault<z.ZodNumber>;
    balance: z.ZodNumber;
    status: z.ZodDefault<z.ZodNativeEnum<typeof FeeStatus>>;
    academicYear: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: FeeStatus;
    fine: number;
    academicYear: string;
    studentId: string;
    amount: number;
    feeStructureId: string;
    discount: number;
    totalDue: number;
    paidAmount: number;
    balance: number;
    _id?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}, {
    academicYear: string;
    studentId: string;
    amount: number;
    feeStructureId: string;
    totalDue: number;
    balance: number;
    status?: FeeStatus | undefined;
    _id?: string | undefined;
    fine?: number | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    discount?: number | undefined;
    paidAmount?: number | undefined;
}>;
export declare const CreateFeeSchema: z.ZodObject<Omit<{
    _id: z.ZodOptional<z.ZodString>;
    studentId: z.ZodString;
    feeStructureId: z.ZodString;
    amount: z.ZodNumber;
    discount: z.ZodDefault<z.ZodNumber>;
    fine: z.ZodDefault<z.ZodNumber>;
    totalDue: z.ZodNumber;
    paidAmount: z.ZodDefault<z.ZodNumber>;
    balance: z.ZodNumber;
    status: z.ZodDefault<z.ZodNativeEnum<typeof FeeStatus>>;
    academicYear: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "_id" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    status: FeeStatus;
    fine: number;
    academicYear: string;
    studentId: string;
    amount: number;
    feeStructureId: string;
    discount: number;
    totalDue: number;
    paidAmount: number;
    balance: number;
}, {
    academicYear: string;
    studentId: string;
    amount: number;
    feeStructureId: string;
    totalDue: number;
    balance: number;
    status?: FeeStatus | undefined;
    fine?: number | undefined;
    discount?: number | undefined;
    paidAmount?: number | undefined;
}>;
export declare const UpdateFeeSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof FeeStatus>>>;
    fine: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    academicYear: z.ZodOptional<z.ZodString>;
    studentId: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    feeStructureId: z.ZodOptional<z.ZodString>;
    discount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    totalDue: z.ZodOptional<z.ZodNumber>;
    paidAmount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    balance: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: FeeStatus | undefined;
    fine?: number | undefined;
    academicYear?: string | undefined;
    studentId?: string | undefined;
    amount?: number | undefined;
    feeStructureId?: string | undefined;
    discount?: number | undefined;
    totalDue?: number | undefined;
    paidAmount?: number | undefined;
    balance?: number | undefined;
}, {
    status?: FeeStatus | undefined;
    fine?: number | undefined;
    academicYear?: string | undefined;
    studentId?: string | undefined;
    amount?: number | undefined;
    feeStructureId?: string | undefined;
    discount?: number | undefined;
    totalDue?: number | undefined;
    paidAmount?: number | undefined;
    balance?: number | undefined;
}>;
export declare const PaymentSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    feeId: z.ZodString;
    studentId: z.ZodString;
    amount: z.ZodNumber;
    mode: z.ZodNativeEnum<typeof PaymentMode>;
    transactionId: z.ZodOptional<z.ZodString>;
    receiptNo: z.ZodString;
    collectedBy: z.ZodString;
    date: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    date: string;
    studentId: string;
    amount: number;
    feeId: string;
    mode: PaymentMode;
    receiptNo: string;
    collectedBy: string;
    _id?: string | undefined;
    createdAt?: string | undefined;
    transactionId?: string | undefined;
}, {
    date: string;
    studentId: string;
    amount: number;
    feeId: string;
    mode: PaymentMode;
    receiptNo: string;
    collectedBy: string;
    _id?: string | undefined;
    createdAt?: string | undefined;
    transactionId?: string | undefined;
}>;
export declare const CreatePaymentSchema: z.ZodObject<Omit<{
    _id: z.ZodOptional<z.ZodString>;
    feeId: z.ZodString;
    studentId: z.ZodString;
    amount: z.ZodNumber;
    mode: z.ZodNativeEnum<typeof PaymentMode>;
    transactionId: z.ZodOptional<z.ZodString>;
    receiptNo: z.ZodString;
    collectedBy: z.ZodString;
    date: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
}, "_id" | "createdAt">, "strip", z.ZodTypeAny, {
    date: string;
    studentId: string;
    amount: number;
    feeId: string;
    mode: PaymentMode;
    receiptNo: string;
    collectedBy: string;
    transactionId?: string | undefined;
}, {
    date: string;
    studentId: string;
    amount: number;
    feeId: string;
    mode: PaymentMode;
    receiptNo: string;
    collectedBy: string;
    transactionId?: string | undefined;
}>;
export declare const AuditLogSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    action: z.ZodString;
    entity: z.ZodString;
    entityId: z.ZodString;
    before: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    after: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    ip: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    _id?: string | undefined;
    createdAt?: string | undefined;
    before?: Record<string, unknown> | undefined;
    after?: Record<string, unknown> | undefined;
    ip?: string | undefined;
    userAgent?: string | undefined;
}, {
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    _id?: string | undefined;
    createdAt?: string | undefined;
    before?: Record<string, unknown> | undefined;
    after?: Record<string, unknown> | undefined;
    ip?: string | undefined;
    userAgent?: string | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type School = z.infer<typeof SchoolSchema>;
export type AcademicYear = z.infer<typeof AcademicYearSchema>;
export type Student = z.infer<typeof StudentSchema>;
export type CreateStudent = z.infer<typeof CreateStudentSchema>;
export type UpdateStudent = z.infer<typeof UpdateStudentSchema>;
export type Teacher = z.infer<typeof TeacherSchema>;
export type CreateTeacher = z.infer<typeof CreateTeacherSchema>;
export type UpdateTeacher = z.infer<typeof UpdateTeacherSchema>;
export type Class = z.infer<typeof ClassSchema>;
export type CreateClass = z.infer<typeof CreateClassSchema>;
export type UpdateClass = z.infer<typeof UpdateClassSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type CreateSection = z.infer<typeof CreateSectionSchema>;
export type UpdateSection = z.infer<typeof UpdateSectionSchema>;
export type Subject = z.infer<typeof SubjectSchema>;
export type CreateSubject = z.infer<typeof CreateSubjectSchema>;
export type UpdateSubject = z.infer<typeof UpdateSubjectSchema>;
export type Attendance = z.infer<typeof AttendanceSchema>;
export type CreateAttendance = z.infer<typeof CreateAttendanceSchema>;
export type MarkAttendance = z.infer<typeof MarkAttendanceSchema>;
export type FeeStructure = z.infer<typeof FeeStructureSchema>;
export type Fee = z.infer<typeof FeeSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
//# sourceMappingURL=index.d.ts.map
