import { Request,Response,NextFunction } from "express";
import { z } from "zod";
import { allocatePaymentManually } from "../services/manualPaymentAllocationService.js";
import { AppError } from "../utils/errors.js";
const schema=z.object({allocations:z.array(z.object({feeItemId:z.string().min(1),amount:z.number().positive()})).min(1).max(100)});
export async function manualAllocatePayment(req:Request,res:Response,next:NextFunction){try{const schoolId=req.user?.schoolId;if(!schoolId)throw AppError.forbidden("A school context is required");const data=schema.parse(req.body);res.json({allocation:await allocatePaymentManually(schoolId,req.params.id,data.allocations,req.user!.userId)})}catch(e){next(e)}}
