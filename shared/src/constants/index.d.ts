export declare enum UserRole {
    SUPER_ADMIN = "super_admin",
    PRINCIPAL = "principal",
    ACCOUNTANT = "accountant",
    TEACHER = "teacher",
    STUDENT = "student",
    PARENT = "parent"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
}
export declare enum StudentStatus {
    ACTIVE = "active",
    LEFT = "left",
    GRADUATED = "graduated",
    TRANSFERRED = "transferred"
}
export declare enum TeacherStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    ON_LEAVE = "on_leave"
}
export declare enum AttendanceStatus {
    PRESENT = "present",
    ABSENT = "absent",
    LATE = "late",
    HALF_DAY = "half_day",
    ON_LEAVE = "on_leave"
}
export declare enum FeeType {
    ADMISSION = "admission",
    MONTHLY = "monthly",
    EXAM = "exam",
    TRANSPORT = "transport",
    HOSTEL = "hostel",
    FINE = "fine",
    OTHER = "other"
}
export declare enum FeeStatus {
    PAID = "paid",
    PARTIAL = "partial",
    PENDING = "pending",
    OVERDUE = "overdue",
    WAIVED = "waived"
}
export declare enum PaymentMode {
    CASH = "cash",
    UPI = "upi",
    CARD = "card",
    BANK_TRANSFER = "bank_transfer",
    CHEQUE = "cheque",
    ONLINE = "online"
}
export declare enum Gender {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other"
}
export declare enum BloodGroup {
    A_POS = "A+",
    A_NEG = "A-",
    B_POS = "B+",
    B_NEG = "B-",
    AB_POS = "AB+",
    AB_NEG = "AB-",
    O_POS = "O+",
    O_NEG = "O-"
}
export declare enum DocumentType {
    BIRTH_CERTIFICATE = "birth_certificate",
    AADHAR = "aadhar",
    TRANSFER_CERTIFICATE = "transfer_certificate",
    MARKSHEET = "marksheet",
    PHOTO = "photo",
    SIGNATURE = "signature",
    OTHER = "other"
}
export declare const ROLE_PERMISSIONS: Record<UserRole, string[]>;
export declare const FEE_TYPE_LABELS: Record<FeeType, string>;
export declare const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string>;
export declare const PAYMENT_MODE_LABELS: Record<PaymentMode, string>;
export declare const GENDER_LABELS: Record<Gender, string>;
export declare const BLOOD_GROUP_LABELS: Record<BloodGroup, string>;
//# sourceMappingURL=index.d.ts.map
