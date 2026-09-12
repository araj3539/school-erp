import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { listBankTransactions, resolveBankTransaction, ignoreBankTransaction, listFeePolicyApprovals, requestFeePolicyApproval, reviewFeePolicyApproval } from "../services/financialOperationsService.js";
import { AppError } from "../utils/errors.js";
const school = (req: Request) => { if (!req.user?.schoolId) throw AppError.forbidden("A school context is required"); return req.user.schoolId; };
const approvalBody = z.object({ proposedChanges: z.record(z.unknown()) }); const reviewBody = z.object({ approved: z.boolean(), reason: z.string().trim().max(500).optional() }); const orderBody = z.object({ orderId: z.string().min(1) });
export async function getBankTransactions(req: Request, res: Response, next: NextFunction) { try { const page=Math.max(1,Number(req.query.page||1)); const limit=Math.min(100,Math.max(1,Number(req.query.limit||25))); res.json(await listBankTransactions(school(req),page,limit,typeof req.query.status==="string"?req.query.status:undefined)); } catch(e){next(e)} }
export async function resolveBank(req: Request,res: Response,next: NextFunction){try{const {orderId}=orderBody.parse(req.body);res.json({bankTransaction:await resolveBankTransaction(school(req),req.params.id,orderId,req.user!.userId)})}catch(e){next(e)}}
export async function ignoreBank(req: Request,res: Response,next: NextFunction){try{res.json({bankTransaction:await ignoreBankTransaction(school(req),req.params.id,req.user!.userId)})}catch(e){next(e)}}
export async function getFeePolicyApprovals(req: Request,res: Response,next: NextFunction){try{res.json({data:await listFeePolicyApprovals(school(req),typeof req.query.status==="string"?req.query.status:"pending")})}catch(e){next(e)}}
export async function createFeePolicyApproval(req: Request,res: Response,next: NextFunction){try{const {proposedChanges}=approvalBody.parse(req.body);res.status(201).json({approval:await requestFeePolicyApproval(school(req),req.params.id,proposedChanges,req.user!.userId)})}catch(e){next(e)}}
export async function reviewFeePolicy(req: Request,res: Response,next: NextFunction){try{const data=reviewBody.parse(req.body);res.json({approval:await reviewFeePolicyApproval(school(req),req.params.id,req.user!.userId,data.approved,data.reason)})}catch(e){next(e)}}
