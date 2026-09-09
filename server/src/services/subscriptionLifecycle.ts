import mongoose from "mongoose";
import { ISubscription, Subscription } from "../models/Subscription.js";
import { AppError } from "../utils/errors.js";
import { createAuditLog } from "./auditLog.js";
import { getNextSubscriptionStatus, transitionSubscription } from "./billing.js";

export type SubscriptionAccess = "full" | "grace" | "none";
type LifecycleInput = Pick<ISubscription, "status" | "trialEndsAt" | "currentPeriodEnd" | "cancelAt">;

export type SubscriptionLifecycleSnapshot = {
  status: ISubscription["status"];
  access: SubscriptionAccess;
  mutationsAllowed: boolean;
  cancellationScheduled: boolean;
  effectiveStatus: ISubscription["status"];
};

/** Pure policy evaluation. It never trusts client state and never mutates data. */
export function evaluateSubscriptionLifecycle(subscription: LifecycleInput, now = new Date()): SubscriptionLifecycleSnapshot {
  let effectiveStatus = subscription.status;
  if (subscription.status === "trialing" && subscription.trialEndsAt && subscription.trialEndsAt <= now) effectiveStatus = "expired";
  if (subscription.status === "active" && subscription.cancelAt && subscription.cancelAt <= now) effectiveStatus = "cancelled";
  if (subscription.status === "past_due" && subscription.currentPeriodEnd && subscription.currentPeriodEnd <= now) effectiveStatus = "suspended";
  if (subscription.status === "cancelled" && subscription.currentPeriodEnd && subscription.currentPeriodEnd <= now) effectiveStatus = "expired";

  if (effectiveStatus === "trialing" || effectiveStatus === "active") {
    return { status: subscription.status, effectiveStatus, access: "full", mutationsAllowed: true, cancellationScheduled: Boolean(subscription.cancelAt) };
  }
  if (effectiveStatus === "past_due" && subscription.currentPeriodEnd && subscription.currentPeriodEnd > now) {
    return { status: subscription.status, effectiveStatus, access: "grace", mutationsAllowed: false, cancellationScheduled: false };
  }
  return { status: subscription.status, effectiveStatus, access: "none", mutationsAllowed: false, cancellationScheduled: Boolean(subscription.cancelAt) };
}

export async function reconcileSubscriptionLifecycle(schoolId: string, actorUserId = "system", now = new Date()) {
  const subscription = await Subscription.findOne({ schoolId }).lean();
  if (!subscription) throw AppError.notFound("Subscription not found");
  const policy = evaluateSubscriptionLifecycle(subscription, now);
  if (policy.effectiveStatus === subscription.status) return { subscription, policy };

  const event = policy.effectiveStatus === "expired" ? "expire" : policy.effectiveStatus === "cancelled" ? "cancel" : "suspend";
  getNextSubscriptionStatus(subscription.status, event);
  const updated = await transitionSubscription(schoolId, event, actorUserId);
  return { subscription: updated, policy: evaluateSubscriptionLifecycle(updated as unknown as ISubscription, now) };
}

export async function scheduleSubscriptionCancellation(schoolId: string, actorUserId: string, cancelAt?: Date, ip?: string, userAgent?: string) {
  const session = await mongoose.startSession();
  try {
    let result: Record<string, unknown> | undefined;
    await session.withTransaction(async () => {
      const subscription = await Subscription.findOne({ schoolId }).session(session);
      if (!subscription) throw AppError.notFound("Subscription not found");
      if (!["trialing", "active"].includes(subscription.status)) throw AppError.conflict("Only trialing or active subscriptions can be scheduled for cancellation");
      const effectiveCancelAt = cancelAt ?? subscription.currentPeriodEnd;
      if (effectiveCancelAt <= new Date()) throw AppError.badRequest("Cancellation time must be in the future");
      subscription.cancelAt = effectiveCancelAt;
      await subscription.save({ session });
      await createAuditLog({ userId: actorUserId, schoolId, action: "SUBSCRIPTION_CANCELLATION_SCHEDULED", entity: "Subscription", entityId: subscription._id.toString(), after: { cancelAt: effectiveCancelAt.toISOString() }, ip, userAgent, session });
      result = subscription.toObject() as unknown as Record<string, unknown>;
    });
    return result!;
  } finally { await session.endSession(); }
}

export async function undoSubscriptionCancellation(schoolId: string, actorUserId: string, ip?: string, userAgent?: string) {
  const session = await mongoose.startSession();
  try {
    let result: Record<string, unknown> | undefined;
    await session.withTransaction(async () => {
      const subscription = await Subscription.findOne({ schoolId }).session(session);
      if (!subscription) throw AppError.notFound("Subscription not found");
      if (!["trialing", "active"].includes(subscription.status)) throw AppError.conflict("Cancellation can only be recovered before the subscription is cancelled");
      if (!subscription.cancelAt) throw AppError.conflict("Subscription has no scheduled cancellation");
      const before = subscription.cancelAt;
      subscription.cancelAt = undefined;
      await subscription.save({ session });
      await createAuditLog({ userId: actorUserId, schoolId, action: "SUBSCRIPTION_CANCELLATION_REVERSED", entity: "Subscription", entityId: subscription._id.toString(), before: { cancelAt: before.toISOString() }, after: { cancelAt: null }, ip, userAgent, session });
      result = subscription.toObject() as unknown as Record<string, unknown>;
    });
    return result!;
  } finally { await session.endSession(); }
}
