import { Request } from "express";
import { AdmissionEnquiry, Class, Student } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { createAuditLog } from "./auditLog.js";
import { getTenantId } from "../utils/tenant.js";

const stages = ["enquiry", "contacted", "visit", "application", "documents", "assessment", "accepted", "rejected", "converted"] as const;
type Stage = typeof stages[number];

export async function listAdmissionEnquiries(req: Request) {
  const schoolId = getTenantId(req);
  const stage = typeof req.query.stage === "string" ? req.query.stage : undefined;
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const filter: any = { schoolId };
  if (stage && stages.includes(stage as Stage)) filter.stage = stage;
  if (search) filter.$or = [{ studentName: { $regex: search, $options: "i" } }, { guardianName: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }];
  return AdmissionEnquiry.find(filter).populate("classId convertedStudentId").sort({ followUpAt: 1, createdAt: -1 }).limit(200).lean();
}

export async function createAdmissionEnquiry(req: Request, data: any) {
  const schoolId = getTenantId(req);
  if (data.classId && !(await Class.findOne({ _id: data.classId, schoolId }).select("_id").lean())) throw AppError.badRequest("Class does not belong to this school");
  const enquiry = await AdmissionEnquiry.create({ ...data, schoolId, createdBy: req.user!.userId });
  await createAuditLog({ userId: req.user!.userId, action: "CREATE_ADMISSION_ENQUIRY", entity: "AdmissionEnquiry", entityId: enquiry._id.toString(), after: enquiry.toObject() as any });
  return enquiry;
}

export async function updateAdmissionEnquiry(req: Request, id: string, data: any) {
  const schoolId = getTenantId(req);
  const current = await AdmissionEnquiry.findOne({ _id: id, schoolId });
  if (!current) throw AppError.notFound("Admission enquiry not found");
  if (data.classId && !(await Class.findOne({ _id: data.classId, schoolId }).select("_id").lean())) throw AppError.badRequest("Class does not belong to this school");
  if (data.stage === "converted" && !data.convertedStudentId && !current.convertedStudentId) throw AppError.badRequest("A converted enquiry must reference the created student");
  if (data.convertedStudentId && !(await Student.findOne({ _id: data.convertedStudentId, schoolId }).select("_id").lean())) throw AppError.badRequest("Converted student does not belong to this school");
  const before = current.toObject(); Object.assign(current, data, { updatedBy: req.user!.userId }); await current.save();
  await createAuditLog({ userId: req.user!.userId, action: "UPDATE_ADMISSION_ENQUIRY", entity: "AdmissionEnquiry", entityId: current._id.toString(), before: before as any, after: current.toObject() as any });
  return current;
}
