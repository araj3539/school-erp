import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { listStudentSiblings, linkStudentSiblings, unlinkStudentSiblings } from "../services/studentFamilyService.js";

export async function getStudentSiblings(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const data = await listStudentSiblings(getTenantId(req), id);
    res.json({ data });
  } catch (error) { next(error); }
}

export async function createStudentSibling(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const { siblingId, relationship = "sibling" } = req.validatedBody as { siblingId: string; relationship?: "sibling" | "half_sibling" };
    const family = await linkStudentSiblings(getTenantId(req), id, siblingId, req.user!.userId, relationship);
    res.status(201).json({ family });
  } catch (error) { next(error); }
}

export async function deleteStudentSibling(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, siblingId } = req.validatedParams as { id: string; siblingId: string };
    await unlinkStudentSiblings(getTenantId(req), id, siblingId, req.user!.userId);
    res.json({ message: "Sibling relationship removed" });
  } catch (error) { next(error); }
}
