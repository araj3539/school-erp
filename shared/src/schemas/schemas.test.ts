import { describe, it, expect } from "vitest";
import { CreateStudentSchema, CreateTeacherSchema, CreateClassSchema, CreateSchoolSchema, LoginSchema, ObjectIdSchema } from "./index";

describe("Shared Schemas", () => {
  describe("ObjectIdSchema", () => {
    it("should validate valid ObjectId", () => {
      const validId = "507f1f77bcf86cd799439011";
      expect(ObjectIdSchema.safeParse(validId).success).toBe(true);
    });

    it("should reject invalid ObjectId", () => {
      expect(ObjectIdSchema.safeParse("invalid").success).toBe(false);
      expect(ObjectIdSchema.safeParse("123").success).toBe(false);
    });
  });

  describe("CreateStudentSchema", () => {
    const validStudent = {
      admissionNo: "STU001",
      firstName: "John",
      lastName: "Doe",
      dob: "2010-01-15T00:00:00.000Z",
      gender: "male",
      fatherName: "Robert Doe",
      motherName: "Jane Doe",
      phone: "9876543210",
      address: "123 Main St",
      admissionDate: "2024-01-15T00:00:00.000Z"
    };

    it("should validate valid student data", () => {
      const result = CreateStudentSchema.safeParse(validStudent);
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const { firstName, ...invalid } = validStudent;
      const result = CreateStudentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid gender", () => {
      const result = CreateStudentSchema.safeParse({ ...validStudent, gender: "invalid" });
      expect(result.success).toBe(false);
    });

    it("should accept optional fields", () => {
      const result = CreateStudentSchema.safeParse({
        ...validStudent,
        bloodGroup: "A+",
        religion: "Hindu",
        category: "General",
        guardianPhone: "9876543211",
        previousSchool: "ABC School"
      });
      expect(result.success).toBe(true);
    });
  });

  describe("CreateTeacherSchema", () => {
    const validTeacher = {
      employeeId: "EMP001",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@school.com",
      phone: "9876543210",
      qualification: "M.Ed",
      experience: 5,
      joiningDate: "2020-01-15T00:00:00.000Z",
      salary: 50000
    };

    it("should validate valid teacher data", () => {
      const result = CreateTeacherSchema.safeParse(validTeacher);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = CreateTeacherSchema.safeParse({ ...validTeacher, email: "invalid" });
      expect(result.success).toBe(false);
    });

    it("should reject negative experience", () => {
      const result = CreateTeacherSchema.safeParse({ ...validTeacher, experience: -1 });
      expect(result.success).toBe(false);
    });

    it("should accept optional arrays", () => {
      const result = CreateTeacherSchema.safeParse({
        ...validTeacher,
        subjects: ["507f1f77bcf86cd799439011"],
        classTeacherOf: ["507f1f77bcf86cd799439012"]
      });
      expect(result.success).toBe(true);
    });
  });

  describe("CreateClassSchema", () => {
    const validClass = {
      name: "10",
      displayName: "Class 10",
      capacity: 40
    };

    it("should validate valid class data", () => {
      const result = CreateClassSchema.safeParse(validClass);
      expect(result.success).toBe(true);
    });

    it("should reject capacity less than 1", () => {
      const result = CreateClassSchema.safeParse({ ...validClass, capacity: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe("CreateSchoolSchema", () => {
    const validSchool = {
      name: "Test School",
      address: "123 School St",
      phone: "1234567890",
      email: "admin@testschool.com",
      session: "2024-25",
      academicYear: "507f1f77bcf86cd799439011"
    };

    it("should validate valid school data", () => {
      const result = CreateSchoolSchema.safeParse(validSchool);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = CreateSchoolSchema.safeParse({ ...validSchool, email: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("LoginSchema", () => {
    it("should validate valid login data", () => {
      const result = LoginSchema.safeParse({
        email: "admin@school.com",
        password: "password123"
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = LoginSchema.safeParse({
        email: "invalid",
        password: "password123"
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const result = LoginSchema.safeParse({
        email: "admin@school.com",
        password: ""
      });
      expect(result.success).toBe(false);
    });
  });
});