import { Request, Response, NextFunction } from "express";
import { Student } from "../models/index.js";
import { getTenantId } from "../utils/tenant.js";
import { listStudentSiblings, linkStudentSiblings, unlinkStudentSiblings } from "../services/studentFamilyService.js";
import { AppError } from "../utils/errors.js";
import { UserRole } from "@school-erp/shared";

async function assertSiblingReadAccess(req: Request, studentId: string) {
  const schoolId = getTenantId(req);
  if (req.user!.role !== UserRole.PARENT && req.user!.role !== UserRole.STUDENT) return;
  const query: any = { _id: studentId, schoolId };
  if (req.user!.role === UserRole.PARENT) query.parentIds = req.user!.userId;
  else query.userId = req.user!.userId;
  if (!(await Student.exists(query))) throw AppError.forbidden("You can only access sibling information for an authorized student");
}

export async function getStudentSiblings(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    await assertSiblingReadAccess(req, id);
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
