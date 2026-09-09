import { Request, Response, NextFunction } from "express";
import { UserRole } from "@school-erp/shared";
import { Subscription } from "../models/Subscription.js";
import { evaluateSubscriptionLifecycle } from "../services/subscriptionLifecycle.js";

/**
 * Enforces subscription access at the server boundary. Platform-only requests
 * without tenant context remain unrestricted; tenant mutations never trust the client
 * to declare billing state.
 */
export function requireSubscriptionAccess(options: { allowGrace?: boolean; mutation?: boolean } = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
    if (req.user.role === UserRole.SUPER_ADMIN && !req.user.schoolId) { next(); return; }
    if (!req.user.schoolId) { res.status(403).json({ error: "Tenant context required" }); return; }
    try {
      const subscription = await Subscription.findOne({ schoolId: req.user.schoolId }).select("status trialEndsAt currentPeriodEnd cancelAt").lean();
      if (!subscription) { res.status(403).json({ error: "Active subscription required", code: "SUBSCRIPTION_REQUIRED" }); return; }
      const policy = evaluateSubscriptionLifecycle(subscription);
      const allowed = policy.access === "full" || (!options.mutation && options.allowGrace !== false && policy.access === "grace");
      if (!allowed) {
        res.status(403).json({ error: "Subscription does not permit this operation", code: "SUBSCRIPTION_ACCESS_DENIED", status: policy.effectiveStatus, access: policy.access });
        return;
      }
      next();
    } catch (error) { next(error); }
  };
}
