import { Request, Response, NextFunction } from "express";
import { getStudentFamilyFeeSummary } from "../services/familyFeeService.js";
import { getTenantId } from "../utils/tenant.js";

export async function getFamilyFeeSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const { academicYear } = req.validatedQuery as { academicYear?: string };
    const data = await getStudentFamilyFeeSummary(getTenantId(req), id, academicYear);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}
