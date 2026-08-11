"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOOD_GROUP_LABELS = exports.GENDER_LABELS = exports.PAYMENT_MODE_LABELS = exports.ATTENDANCE_STATUS_LABELS = exports.FEE_TYPE_LABELS = exports.ROLE_PERMISSIONS = exports.DocumentType = exports.BloodGroup = exports.Gender = exports.PaymentMode = exports.FeeStatus = exports.FeeType = exports.AttendanceStatus = exports.TeacherStatus = exports.StudentStatus = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["PRINCIPAL"] = "principal";
    UserRole["ACCOUNTANT"] = "accountant";
    UserRole["TEACHER"] = "teacher";
    UserRole["STUDENT"] = "student";
    UserRole["PARENT"] = "parent";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var StudentStatus;
(function (StudentStatus) {
    StudentStatus["ACTIVE"] = "active";
    StudentStatus["LEFT"] = "left";
    StudentStatus["GRADUATED"] = "graduated";
    StudentStatus["TRANSFERRED"] = "transferred";
})(StudentStatus || (exports.StudentStatus = StudentStatus = {}));
var TeacherStatus;
(function (TeacherStatus) {
    TeacherStatus["ACTIVE"] = "active";
    TeacherStatus["INACTIVE"] = "inactive";
    TeacherStatus["ON_LEAVE"] = "on_leave";
})(TeacherStatus || (exports.TeacherStatus = TeacherStatus = {}));
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus["PRESENT"] = "present";
    AttendanceStatus["ABSENT"] = "absent";
    AttendanceStatus["LATE"] = "late";
    AttendanceStatus["HALF_DAY"] = "half_day";
    AttendanceStatus["ON_LEAVE"] = "on_leave";
})(AttendanceStatus || (exports.AttendanceStatus = AttendanceStatus = {}));
var FeeType;
(function (FeeType) {
    FeeType["ADMISSION"] = "admission";
    FeeType["MONTHLY"] = "monthly";
    FeeType["EXAM"] = "exam";
    FeeType["TRANSPORT"] = "transport";
    FeeType["HOSTEL"] = "hostel";
    FeeType["FINE"] = "fine";
    FeeType["OTHER"] = "other";
})(FeeType || (exports.FeeType = FeeType = {}));
var FeeStatus;
(function (FeeStatus) {
    FeeStatus["PAID"] = "paid";
    FeeStatus["PARTIAL"] = "partial";
    FeeStatus["PENDING"] = "pending";
    FeeStatus["OVERDUE"] = "overdue";
    FeeStatus["WAIVED"] = "waived";
})(FeeStatus || (exports.FeeStatus = FeeStatus = {}));
var PaymentMode;
(function (PaymentMode) {
    PaymentMode["CASH"] = "cash";
    PaymentMode["UPI"] = "upi";
    PaymentMode["CARD"] = "card";
    PaymentMode["BANK_TRANSFER"] = "bank_transfer";
    PaymentMode["CHEQUE"] = "cheque";
    PaymentMode["ONLINE"] = "online";
})(PaymentMode || (exports.PaymentMode = PaymentMode = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "male";
    Gender["FEMALE"] = "female";
    Gender["OTHER"] = "other";
})(Gender || (exports.Gender = Gender = {}));
var BloodGroup;
(function (BloodGroup) {
    BloodGroup["A_POS"] = "A+";
    BloodGroup["A_NEG"] = "A-";
    BloodGroup["B_POS"] = "B+";
    BloodGroup["B_NEG"] = "B-";
    BloodGroup["AB_POS"] = "AB+";
    BloodGroup["AB_NEG"] = "AB-";
    BloodGroup["O_POS"] = "O+";
    BloodGroup["O_NEG"] = "O-";
})(BloodGroup || (exports.BloodGroup = BloodGroup = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["BIRTH_CERTIFICATE"] = "birth_certificate";
    DocumentType["AADHAR"] = "aadhar";
    DocumentType["TRANSFER_CERTIFICATE"] = "transfer_certificate";
    DocumentType["MARKSHEET"] = "marksheet";
    DocumentType["PHOTO"] = "photo";
    DocumentType["SIGNATURE"] = "signature";
    DocumentType["OTHER"] = "other";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
exports.ROLE_PERMISSIONS = { [UserRole.SUPER_ADMIN]: ["*"], [UserRole.PRINCIPAL]: ["students:read", "students:write", "students:delete", "teachers:read", "teachers:write", "teachers:delete", "classes:read", "classes:write", "classes:delete", "attendance:read", "attendance:write", "fees:read", "fees:write", "fees:delete", "reports:read", "reports:export", "settings:read", "settings:write", "users:read", "users:write"], [UserRole.ACCOUNTANT]: ["fees:read", "fees:write", "payments:read", "payments:write", "expenses:read", "expenses:write", "salary:read", "salary:write", "reports:read", "reports:export"], [UserRole.TEACHER]: ["attendance:read", "attendance:write", "homework:read", "homework:write", "marks:read", "marks:write", "students:read", "notices:read"], [UserRole.STUDENT]: ["attendance:read:own", "homework:read:own", "marks:read:own", "fees:read:own", "notices:read"], [UserRole.PARENT]: ["attendance:read:child", "homework:read:child", "marks:read:child", "fees:read:child", "notices:read"] };
exports.FEE_TYPE_LABELS = { [FeeType.ADMISSION]: "Admission Fee", [FeeType.MONTHLY]: "Monthly Fee", [FeeType.EXAM]: "Exam Fee", [FeeType.TRANSPORT]: "Transport Fee", [FeeType.HOSTEL]: "Hostel Fee", [FeeType.FINE]: "Fine", [FeeType.OTHER]: "Other" };
exports.ATTENDANCE_STATUS_LABELS = { [AttendanceStatus.PRESENT]: "Present", [AttendanceStatus.ABSENT]: "Absent", [AttendanceStatus.LATE]: "Late", [AttendanceStatus.HALF_DAY]: "Half Day", [AttendanceStatus.ON_LEAVE]: "On Leave" };
exports.PAYMENT_MODE_LABELS = { [PaymentMode.CASH]: "Cash", [PaymentMode.UPI]: "UPI", [PaymentMode.CARD]: "Card", [PaymentMode.BANK_TRANSFER]: "Bank Transfer", [PaymentMode.CHEQUE]: "Cheque", [PaymentMode.ONLINE]: "Online" };
exports.GENDER_LABELS = { [Gender.MALE]: "Male", [Gender.FEMALE]: "Female", [Gender.OTHER]: "Other" };
exports.BLOOD_GROUP_LABELS = { [BloodGroup.A_POS]: "A+", [BloodGroup.A_NEG]: "A-", [BloodGroup.B_POS]: "B+", [BloodGroup.B_NEG]: "B-", [BloodGroup.AB_POS]: "AB+", [BloodGroup.AB_NEG]: "AB-", [BloodGroup.O_POS]: "O+", [BloodGroup.O_NEG]: "O-" };
