import { Types } from "mongoose";
import { AcademicYear, Class, Section, Student } from "../models/index.js";
import { AppError } from "../utils/errors.js";

export function requireSchoolId(value: string | Types.ObjectId | undefined): Types.ObjectId { if (!value) throw AppError.forbidden("A school context is required"); return new Types.ObjectId(value); }
export async function assertAcademicYearInSchool(id: string | Types.ObjectId, schoolId: string | Types.ObjectId) { const year = await AcademicYear.findOne({ _id: id, schoolId }).lean(); if (!year) throw AppError.notFound("Academic year not found"); return year; }
export async function assertClassInSchool(id: string | Types.ObjectId, schoolId: string | Types.ObjectId) { const value = await Class.findOne({ _id: id, schoolId }).lean(); if (!value) throw AppError.notFound("Class not found"); return value; }
export async function assertSectionInSchool(id: string | Types.ObjectId, classId: string | Types.ObjectId) { const value = await Section.findOne({ _id: id, classId }).lean(); if (!value) throw AppError.notFound("Section not found"); return value; }
export async function assertStudentInSchool(id: string | Types.ObjectId, schoolId: string | Types.ObjectId) { const value = await Student.findOne({ _id: id, schoolId }).lean(); if (!value) throw AppError.notFound("Student not found"); return value; }
