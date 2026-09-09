import { Request, Response, NextFunction } from "express";
import { getBillingHistory, voidInvoice } from "../services/saasInvoice.js";
import { AppError } from "../utils/errors.js";

function tenantSchoolId(req: Request): string {
  if (!req.user?.schoolId) throw AppError.forbidden("Tenant billing context required");
  return req.user.schoolId;
}

export async function getSaaSBillingHistoryController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    if (status && !["issued", "paid", "overdue", "void"].includes(status)) throw AppError.badRequest("Invalid invoice status");
    const result = await getBillingHistory(tenantSchoolId(req), page, limit, status);
    res.json({ data: result });
  } catch (error) { next(error); }
}

export async function voidSaaSInvoiceController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await voidInvoice(req.params.invoiceId, req.user!.userId, req.ip, req.get("user-agent"));
    res.json({ data: invoice });
  } catch (error) { next(error); }
}
