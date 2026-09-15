import { NextFunction, Request, Response } from "express";
import { getAtRiskStudents } from "../services/atRiskStudentService.js";

export async function listAtRiskStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getAtRiskStudents(req);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
