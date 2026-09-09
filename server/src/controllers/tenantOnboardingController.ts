import { Request, Response, NextFunction } from "express";
import { provisionTenant } from "../services/tenantOnboarding.js";
import type { TenantOnboardingInput } from "../validators/tenantOnboardingValidators.js";

export async function provisionTenantController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await provisionTenant(req.body as TenantOnboardingInput, req.user!.userId, req.ip, req.get("user-agent"));
    res.status(result.idempotentReplay ? 200 : 201).json({ data: result });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 409) { res.status(409).json({ error: (error as Error).message }); return; }
    }
    next(error);
  }
}
