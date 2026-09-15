import { Request, Response, NextFunction } from "express";
import { getTenantId } from "../utils/tenant.js";
import { AppError } from "../utils/errors.js";
import { assignSubstitute, createAbsence, eligibleSubstitutes, getAbsenceDetails, listAbsences } from "../services/teacherAbsenceService.js";

export async function getTeacherAbsences(req: Request, res: Response, next: NextFunction) {
  try { res.json({ data: await listAbsences(getTenantId(req), req.validatedQuery || {}) }); } catch (e) { next(e); }
}

export async function createTeacherAbsence(req: Request, res: Response, next: NextFunction) {
  try { const result = await createAbsence(getTenantId(req), req.validatedBody, req.user!.userId); res.status(result && "absence" in result ? 201 : 200).json(result); } catch (e) { next(e); }
}

export async function getTeacherAbsence(req: Request, res: Response, next: NextFunction) {
  try { const { id } = req.validatedParams as { id: string }; res.json(await getAbsenceDetails(getTenantId(req), id)); } catch (e) { next(e); }
}

export async function getEligibleSubstitutes(req: Request, res: Response, next: NextFunction) {
  try { const { id } = req.validatedParams as { id: string }; const timetableId = String(req.query.timetableId || ""); if (!/^[a-f\d]{24}$/i.test(timetableId)) throw AppError.badRequest("Valid timetableId is required"); res.json({ data: await eligibleSubstitutes(getTenantId(req), id, timetableId) }); } catch (e) { next(e); }
}

export async function assignTeacherSubstitute(req: Request, res: Response, next: NextFunction) {
  try { const { id } = req.validatedParams as { id: string }; const data: any = req.validatedBody; res.json({ absence: await assignSubstitute(getTenantId(req), id, data.timetableId, data.substituteTeacherId, req.user!.userId) }); } catch (e) { next(e); }
}
