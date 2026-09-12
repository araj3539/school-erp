import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Class, Section, Student } from "../models/index.js";
import { UserRole } from "@school-erp/shared";
import { getTenantId } from "../utils/tenant.js";
import { AppError } from "../utils/errors.js";
import { createAuditLog } from "../services/auditLog.js";
const MANAGEMENT = new Set([UserRole.SUPER_ADMIN, UserRole.PRINCIPAL, UserRole.SUPPORT_ADMIN]);
function assertManagement(req: Request) { if (!MANAGEMENT.has(req.user!.role)) throw AppError.forbidden("Only school management can change class or section assignments"); }
async function resolve(req: Request) {
  const body = req.validatedBody as any; const schoolId = getTenantId(req);
  const [cls, section] = await Promise.all([Class.findOne({_id:body.classId,schoolId}), Section.findOne({_id:body.sectionId,schoolId})]);
  if (!cls) throw AppError.notFound("Class not found");
  if (!section || section.classId.toString() !== cls._id.toString()) throw AppError.badRequest("Section must belong to the selected class");
  const activeCount = await Student.countDocuments({schoolId,classId:cls._id,sectionId:section._id,status:"active"});
  return {schoolId,cls,section,activeCount,body};
}
export async function getSectionGovernance(req:Request,res:Response,next:NextFunction){try{assertManagement(req);const r=await resolve(req);res.json({class:r.cls,section:r.section,activeStudentCount:r.activeCount,availableCapacity:Math.max(0,r.section.capacity-r.activeCount)});}catch(e){next(e);}}
export async function assignStudentsToSection(req:Request,res:Response,next:NextFunction){const session=await mongoose.startSession();try{assertManagement(req);const r=await resolve(req);const ids=r.body.studentIds;const students=await Student.find({_id:{$in:ids},schoolId:r.schoolId,status:"active"}).select("_id").session(session).lean();if(students.length!==ids.length)throw AppError.conflict("All selected students must be active students in this school");const current=await Student.countDocuments({schoolId:r.schoolId,classId:r.cls._id,sectionId:r.section._id,status:"active"}).session(session);const movingIntoSection=await Student.countDocuments({_id:{$in:ids},schoolId:r.schoolId,classId:r.cls._id,sectionId:{$ne:r.section._id},status:"active"}).session(session);if(current+movingIntoSection>r.section.capacity)throw AppError.conflict(`Section capacity exceeded by ${current+movingIntoSection-r.section.capacity} student(s)`);await session.withTransaction(async()=>{await Student.updateMany({_id:{$in:ids},schoolId:r.schoolId,status:"active"},{$set:{classId:r.cls._id,sectionId:r.section._id}},{session});await createAuditLog({schoolId:r.schoolId.toString(),userId:req.user!.userId,action:"SECTION_ASSIGNMENT",entity:"Section",entityId:r.section._id.toString(),after:{classId:r.cls._id,studentCount:ids.length},session});});res.json({message:"Students assigned to section",assigned:ids.length});}catch(e){next(e);}finally{await session.endSession();}}
