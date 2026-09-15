import { Request, Response, NextFunction } from "express";
import { UserRole } from "@school-erp/shared";
import { getTenantId } from "../utils/tenant.js";
import { createBehaviour, listBehaviour, getBehaviour, updateBehaviour, acknowledgeBehaviour } from "../services/studentBehaviourService.js";
import { Student } from "../models/index.js";

export async function create(req:Request,res:Response,next:NextFunction){try{res.status(201).json(await createBehaviour(getTenantId(req),req.validatedBody,req.user!.userId));}catch(e){next(e);}}
export async function list(req:Request,res:Response,next:NextFunction){try{const q={...(req.validatedQuery||{})};if(req.user!.role===UserRole.PARENT){const students=await Student.find({schoolId:getTenantId(req),parentIds:req.user!.userId}).select("_id").lean();q.studentId=undefined;const rows=await listBehaviour(getTenantId(req),q);res.json(rows.filter((r:any)=>students.some((s:any)=>s._id.toString()===r.studentId.toString())));return;}if(req.user!.role===UserRole.STUDENT){q.studentId=req.user!.userId;}
res.json(await listBehaviour(getTenantId(req),q));}catch(e){next(e);}}
export async function detail(req:Request,res:Response,next:NextFunction){try{const doc:any=await getBehaviour(getTenantId(req),req.params.id);if(req.user!.role===UserRole.PARENT||req.user!.role===UserRole.STUDENT){const students=await Student.find({schoolId:getTenantId(req),...(req.user!.role===UserRole.PARENT?{parentIds:req.user!.userId}:{userId:req.user!.userId})}).select("_id").lean();if(!students.some((s:any)=>s._id.toString()===doc.studentId.toString()))return res.status(403).json({error:"Not authorized"});}res.json(doc);}catch(e){next(e);}}
export async function update(req:Request,res:Response,next:NextFunction){try{res.json(await updateBehaviour(getTenantId(req),req.params.id,req.validatedBody,req.user!.userId));}catch(e){next(e);}}
export async function acknowledge(req:Request,res:Response,next:NextFunction){try{res.json(await acknowledgeBehaviour(getTenantId(req),req.params.id,req.user!.userId));}catch(e){next(e);}}
