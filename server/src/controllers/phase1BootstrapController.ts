import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { School, AcademicYear, Class, Section, User, Teacher, Student } from "../models/index.js";
import { env } from "../config/index.js";
import { hashPassword, generateAccessToken, generateRefreshToken, setAuthCookies } from "../services/auth.js";
import { UserRole, StudentStatus, TeacherStatus, Gender } from "@school-erp/shared";
import { AppError } from "../utils/errors.js";

const FIXTURE_PASSWORD = "Phase1Test@2026!";
const SCHOOL_A_ID = new mongoose.Types.ObjectId("66a000000000000000000001");
const SCHOOL_B_ID = new mongoose.Types.ObjectId("66b000000000000000000001");
const AY_A_ID = new mongoose.Types.ObjectId("71a000000000000000000001");
const AY_B_ID = new mongoose.Types.ObjectId("71b000000000000000000001");
const CLASS_A_ID = new mongoose.Types.ObjectId("72a000000000000000000001");
const CLASS_B_ID = new mongoose.Types.ObjectId("72b000000000000000000001");
const SECTION_A_ID = new mongoose.Types.ObjectId("73a000000000000000000001");
const SECTION_B_ID = new mongoose.Types.ObjectId("73b000000000000000000001");
const PRINCIPAL_A_ID = new mongoose.Types.ObjectId("74a000000000000000000001");
const TEACHER_A_USER_ID = new mongoose.Types.ObjectId("74a000000000000000000002");
const STUDENT_A_USER_ID = new mongoose.Types.ObjectId("74a000000000000000000003");
const PARENT_A_USER_ID = new mongoose.Types.ObjectId("74a000000000000000000004");
const STUDENT_B_USER_ID = new mongoose.Types.ObjectId("74b000000000000000000001");
const TEACHER_A_ID = new mongoose.Types.ObjectId("75a000000000000000000001");
const STUDENT_A_ID = new mongoose.Types.ObjectId("76a000000000000000000001");
const STUDENT_B_ID = new mongoose.Types.ObjectId("76b000000000000000000001");

const credentials = {
  principalA: "principal.a@phase1.example.com",
  teacherA: "teacher.a@phase1.example.com",
  studentA: "student.a@phase1.example.com",
  parentA: "parent.a@phase1.example.com",
  studentB: "student.b@phase1.example.com",
};

function assertSecret(req: Request) {
  if (!env.PHASE1_BOOTSTRAP_SECRET || req.get("X-Phase1-Bootstrap-Secret") !== env.PHASE1_BOOTSTRAP_SECRET) {
    throw AppError.forbidden("Invalid Phase 1 bootstrap secret");
  }
}

export async function bootstrapPhase1Fixtures(req: Request, res: Response, next: NextFunction) {
  try {
    assertSecret(req);
    if (await School.exists({ code: "SCH-PHASE1-A" })) throw AppError.conflict("Phase 1 fixtures already exist");

    const passwordHash = await hashPassword(FIXTURE_PASSWORD);
    const now = new Date();
    await School.create([
      { _id: SCHOOL_A_ID, name: "Phase 1 Test School A", code: "SCH-PHASE1-A", address: "Phase 1 Test Address A", phone: "9000001001", email: "phase1-a@example.com", session: "2026-27", academicYear: AY_A_ID, settings: {} },
      { _id: SCHOOL_B_ID, name: "Phase 1 Test School B", code: "SCH-PHASE1-B", address: "Phase 1 Test Address B", phone: "9000001002", email: "phase1-b@example.com", session: "2026-27", academicYear: AY_B_ID, settings: {} },
    ]);
    await AcademicYear.create([
      { _id: AY_A_ID, name: "2026-27", startDate: new Date("2026-04-01"), endDate: new Date("2027-03-31"), isCurrent: true, schoolId: SCHOOL_A_ID },
      { _id: AY_B_ID, name: "2026-27", startDate: new Date("2026-04-01"), endDate: new Date("2027-03-31"), isCurrent: true, schoolId: SCHOOL_B_ID },
    ]);
    await Class.create([
      { _id: CLASS_A_ID, name: "8", displayName: "Class 8", schoolId: SCHOOL_A_ID, sectionIds: [SECTION_A_ID], capacity: 40 },
      { _id: CLASS_B_ID, name: "8", displayName: "Class 8", schoolId: SCHOOL_B_ID, sectionIds: [SECTION_B_ID], capacity: 40 },
    ]);
    await Section.create([
      { _id: SECTION_A_ID, name: "A", classId: CLASS_A_ID, schoolId: SCHOOL_A_ID, capacity: 40 },
      { _id: SECTION_B_ID, name: "A", classId: CLASS_B_ID, schoolId: SCHOOL_B_ID, capacity: 40 },
    ]);
    await User.create([
      { _id: PRINCIPAL_A_ID, email: credentials.principalA, passwordHash, role: UserRole.PRINCIPAL, schoolId: SCHOOL_A_ID, isActive: true, refreshTokenVersion: 0 },
      { _id: TEACHER_A_USER_ID, email: credentials.teacherA, passwordHash, role: UserRole.TEACHER, schoolId: SCHOOL_A_ID, isActive: true, refreshTokenVersion: 0 },
      { _id: STUDENT_A_USER_ID, email: credentials.studentA, passwordHash, role: UserRole.STUDENT, schoolId: SCHOOL_A_ID, isActive: true, refreshTokenVersion: 0 },
      { _id: PARENT_A_USER_ID, email: credentials.parentA, passwordHash, role: UserRole.PARENT, schoolId: SCHOOL_A_ID, isActive: true, refreshTokenVersion: 0 },
      { _id: STUDENT_B_USER_ID, email: credentials.studentB, passwordHash, role: UserRole.STUDENT, schoolId: SCHOOL_B_ID, isActive: true, refreshTokenVersion: 0 },
    ]);
    await Teacher.create({ _id: TEACHER_A_ID, employeeId: "PH1-TEACH-A", userId: TEACHER_A_USER_ID, schoolId: SCHOOL_A_ID, firstName: "Phase1", lastName: "TeacherA", email: credentials.teacherA, phone: "9000001011", qualification: "B.Ed", experience: 3, joiningDate: now, salary: 0, subjects: [], classTeacherOf: [CLASS_A_ID], documents: [], status: TeacherStatus.ACTIVE });
    await Student.create([
      { _id: STUDENT_A_ID, admissionNo: "PH1-A-001", userId: STUDENT_A_USER_ID, parentIds: [PARENT_A_USER_ID], schoolId: SCHOOL_A_ID, classId: CLASS_A_ID, sectionId: SECTION_A_ID, firstName: "Student", lastName: "A", dob: new Date("2012-06-01"), gender: Gender.MALE, fatherName: "Parent A", motherName: "Parent A Mother", phone: "9000001021", address: "Phase 1 Test Address A", documents: [], status: StudentStatus.ACTIVE, admissionDate: now },
      { _id: STUDENT_B_ID, admissionNo: "PH1-B-001", userId: STUDENT_B_USER_ID, parentIds: [], schoolId: SCHOOL_B_ID, classId: CLASS_B_ID, sectionId: SECTION_B_ID, firstName: "Student", lastName: "B", dob: new Date("2012-06-02"), gender: Gender.MALE, fatherName: "Parent B", motherName: "Parent B Mother", phone: "9000001022", address: "Phase 1 Test Address B", documents: [], status: StudentStatus.ACTIVE, admissionDate: now },
    ]);

    const token = (userId: string, email: string, role: UserRole, schoolId: string) => ({
      accessToken: generateAccessToken({ userId, email, role, schoolId }),
      refreshToken: generateRefreshToken({ userId, email, role, schoolId }),
    });
    const principalTokens = token(PRINCIPAL_A_ID.toString(), credentials.principalA, UserRole.PRINCIPAL, SCHOOL_A_ID.toString());
    const teacherTokens = token(TEACHER_A_USER_ID.toString(), credentials.teacherA, UserRole.TEACHER, SCHOOL_A_ID.toString());
    const studentTokens = token(STUDENT_A_USER_ID.toString(), credentials.studentA, UserRole.STUDENT, SCHOOL_A_ID.toString());
    const parentTokens = token(PARENT_A_USER_ID.toString(), credentials.parentA, UserRole.PARENT, SCHOOL_A_ID.toString());

    res.status(201).json({
      message: "Phase 1 fixtures created",
      fixturePassword: FIXTURE_PASSWORD,
      schools: { schoolA: SCHOOL_A_ID.toString(), schoolB: SCHOOL_B_ID.toString() },
      students: { schoolAStudent: STUDENT_A_ID.toString(), schoolBStudent: STUDENT_B_ID.toString() },
      tokens: { principalA: principalTokens.accessToken, teacherA: teacherTokens.accessToken, studentA: studentTokens.accessToken, parentA: parentTokens.accessToken, refresh: studentTokens.refreshToken },
      credentials,
    });
  } catch (error) {
    next(error);
  }
}
