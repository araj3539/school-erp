import { Request, Response, NextFunction } from "express";
import { provisionTenant } from "../services/tenantOnboarding.js";
import type { TenantOnboardingInput } from "../validators/tenantOnboardingValidators.js";

export async function provisionTenantController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await provisionTenant(req.body as TenantOnboardingInput, req.user!.userId, req.ip, req.get("user-agent"));
    res.status(result.idempotentReplay ? 200 : 201).json({ data: result });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      const statusCode = (error as { statusCode?: unknown }).statusCode;
      if (statusCode === 409) {
        const message = error instanceof Error ? error.message : "Tenant provisioning conflict";
        res.status(409).json({ error: message });
        return;
      }
    }
    next(error);
  }
}
