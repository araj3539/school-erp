import { Request, Response, NextFunction } from "express";
import { UserRole } from "@school-erp/shared";
import { Subscription } from "../models/Subscription.js";
import { isModuleEnabled, ModuleId } from "../services/moduleEntitlement.js";
import { evaluateSubscriptionLifecycle } from "../services/subscriptionLifecycle.js";

export function requireModule(moduleId: ModuleId) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
    if (req.user.role === UserRole.SUPER_ADMIN && !req.user.schoolId) { next(); return; }
    if (!req.user.schoolId) { res.status(403).json({ error: "Tenant context required" }); return; }
    try {
      // Tenants created before billing activation remain usable until a subscription
      // exists. Once subscribed, billing lifecycle becomes an authoritative gate.
      const subscription = await Subscription.findOne({ schoolId: req.user.schoolId }).select("status trialEndsAt currentPeriodEnd cancelAt").lean();
      if (subscription) {
        const policy = evaluateSubscriptionLifecycle(subscription);
        if (policy.access === "none") {
          res.status(403).json({ error: "Subscription does not permit this operation", code: "SUBSCRIPTION_ACCESS_DENIED", status: policy.effectiveStatus });
          return;
        }
        if (req.method !== "GET" && !policy.mutationsAllowed) {
          res.status(403).json({ error: "Subscription is in a restricted grace period; mutations are disabled", code: "SUBSCRIPTION_MUTATIONS_DISABLED", status: policy.effectiveStatus });
          return;
        }
      }
      if (!(await isModuleEnabled(req.user.schoolId, moduleId))) {
        res.status(403).json({ error: "Module is disabled for this tenant", code: "MODULE_DISABLED", moduleId });
        return;
      }
      next();
    } catch (error) { next(error); }
  };
}
