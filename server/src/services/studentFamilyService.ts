import mongoose from "mongoose";
import { StudentFamily, Student } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { createAuditLog } from "./auditLog.js";

function normalizedPair(a: string, b: string): [string, string] {
  return [a, b].sort();
}

export async function listStudentSiblings(schoolId: string, studentId: string) {
  const families = await StudentFamily.find({ schoolId, studentIds: studentId }).populate("studentIds", "admissionNo firstName lastName classId sectionId status").lean();
  return families.flatMap((family: any) => family.studentIds.filter((student: any) => student._id.toString() !== studentId));
}

export async function linkStudentSiblings(schoolId: string, studentId: string, siblingId: string, actorId: string, relationship: "sibling" | "half_sibling" = "sibling") {
  if (studentId === siblingId) throw AppError.badRequest("A student cannot be linked as their own sibling");
  const [student, sibling] = await Promise.all([
    Student.findOne({ _id: studentId, schoolId }).select("_id").lean(),
    Student.findOne({ _id: siblingId, schoolId }).select("_id").lean()
  ]);
  if (!student || !sibling) throw AppError.badRequest("Both students must belong to the same school");
  const [first, second] = normalizedPair(studentId, siblingId);
  const existing = await StudentFamily.findOne({ schoolId, studentIds: { $all: [first, second] } });
  if (existing) throw AppError.conflict("These students are already linked as siblings");
  const family = await StudentFamily.create({ schoolId, studentIds: [first, second], relationship, createdBy: actorId });
  await createAuditLog({ userId: actorId, action: "LINK_SIBLINGS", entity: "StudentFamily", entityId: family._id.toString(), after: { studentIds: [first, second], relationship } });
  return family;
}

export async function unlinkStudentSiblings(schoolId: string, studentId: string, siblingId: string, actorId: string) {
  const [first, second] = normalizedPair(studentId, siblingId);
  const family = await StudentFamily.findOneAndDelete({ schoolId, studentIds: { $all: [first, second] } });
  if (!family) throw AppError.notFound("Sibling relationship not found");
  await createAuditLog({ userId: actorId, action: "UNLINK_SIBLINGS", entity: "StudentFamily", entityId: family._id.toString(), before: family.toObject() });
  return family;
}
