import { Request,Response,NextFunction } from "express";
import { createPTM,listPTMs,getPTM,bookPTM,updateAppointment,openPTM } from "../services/ptmService.js";
import { getTenantId } from "../utils/tenant.js";
export async function create(req:Request,res:Response,next:NextFunction){try{res.status(201).json(await createPTM(getTenantId(req),req.validatedBody,req.user!.userId))}catch(e){next(e)}}
export async function list(req:Request,res:Response,next:NextFunction){try{res.json(await listPTMs(getTenantId(req),req.validatedQuery||{}))}catch(e){next(e)}}
export async function detail(req:Request,res:Response,next:NextFunction){try{res.json(await getPTM(getTenantId(req),req.params.id))}catch(e){next(e)}}
export async function open(req:Request,res:Response,next:NextFunction){try{res.json(await openPTM(getTenantId(req),req.params.id,req.user!.userId))}catch(e){next(e)}}
export async function book(req:Request,res:Response,next:NextFunction){try{res.status(201).json(await bookPTM(getTenantId(req),req.params.id,req.validatedBody,req.user!.userId))}catch(e){next(e)}}
export async function appointment(req:Request,res:Response,next:NextFunction){try{res.json(await updateAppointment(getTenantId(req),req.params.id,req.params.appointmentId,req.validatedBody,req.user!.userId))}catch(e){next(e)}}