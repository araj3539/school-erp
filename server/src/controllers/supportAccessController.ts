import { Request, Response } from "express";
import { getSupportAuditHistory, getSupportDiagnostics } from "../services/supportAccess.js";

export async function getSupportDiagnosticsController(req: Request, res: Response): Promise<void> {
  const diagnostics = await getSupportDiagnostics({
    supportUserId: req.user!.userId,
    schoolId: req.params.schoolId,
    reason: String(req.body.reason || ""),
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  res.json({ diagnostics });
}

export async function getSupportAuditHistoryController(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const history = await getSupportAuditHistory(req.params.schoolId, Number.isFinite(page) ? page : 1, Number.isFinite(limit) ? limit : 20);
  res.json(history);
}
