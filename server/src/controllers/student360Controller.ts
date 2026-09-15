import type { Request, Response, NextFunction } from "express";
import { getStudent360 } from "../services/student360Service.js";

export async function getStudent360Controller(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getStudent360(req, req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
}
