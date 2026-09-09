import mongoose from "mongoose";
import { SaaSPlan, SaaSProduct, School, Subscription } from "../models/index.js";
import { createAuditLog } from "./auditLog.js";
import { AppError } from "../utils/errors.js";
import type { CreatePlanVersionInput, CreateProductVersionInput } from "../validators/billingValidators.js";
import type { SubscriptionStatus } from "../models/Subscription.js";

const transitions: Record<SubscriptionStatus, Partial<Record<SubscriptionEvent, SubscriptionStatus>>> = {
  trialing: { activate: "active", cancel: "cancelled", expire: "expired" },
  active: { mark_past_due: "past_due", suspend: "suspended", cancel: "cancelled" },
  past_due: { recover: "active", suspend: "suspended", cancel: "cancelled" },
  suspended: { recover: "active", cancel: "cancelled", expire: "expired" },
  cancelled: { expire: "expired" },
  expired: {},
};

type SubscriptionEvent = "activate" | "mark_past_due" | "suspend" | "cancel" | "expire" | "recover";

function addBillingInterval(date: Date, interval: "month" | "year"): Date {
  const result = new Date(date);
  if (interval === "month") result.setUTCMonth(result.getUTCMonth() + 1);
  else result.setUTCFullYear(result.getUTCFullYear() + 1);
  return result;
}

function invalidTransition(status: SubscriptionStatus, event: SubscriptionEvent): never {
  throw AppError.conflict(`Invalid subscription transition: ${status} -> ${event}`);
}

export async function createProductVersion(input: CreateProductVersionInput, actorUserId: string, ip?: string, userAgent?: string) {
  const existing = await SaaSProduct.findOne({ code: input.code, version: input.version });
  if (existing) throw AppError.conflict("Product version already exists");
  const product = await SaaSProduct.create({ ...input, status: "active" });
  await createAuditLog({ userId: actorUserId, action: "CREATE", entity: "SaaSProduct", entityId: product._id.toString(), after: { code: product.code, version: product.version, name: product.name }, ip, userAgent });
  return product.toObject();
}

export async function createPlanVersion(input: CreatePlanVersionInput, actorUserId: string, ip?: string, userAgent?: string) {
  const product = await SaaSProduct.findById(input.productId);
  if (!product || product.status !== "active") throw AppError.notFound("Active SaaS product not found");
  const existing = await SaaSPlan.findOne({ productId: input.productId, code: input.code, version: input.version });
  if (existing) throw AppError.conflict("Plan version already exists");
  const plan = await SaaSPlan.create({ ...input, status: "active" });
  await createAuditLog({ userId: actorUserId, action: "CREATE", entity: "SaaSPlan", entityId: plan._id.toString(), after: { productId: product._id.toString(), code: plan.code, version: plan.version, amountMinor: plan.amountMinor, currency: plan.currency, billingInterval: plan.billingInterval }, ip, userAgent });
  return plan.toObject();
}

export async function createSubscription(schoolId: string, planId: string, actorUserId: string, startedAt = new Date(), ip?: string, userAgent?: string) {
  const session = await mongoose.startSession();
  try {
    let created: ReturnType<typeof Subscription.prototype.toObject> | undefined;
    await session.withTransaction(async () => {
      const school = await School.findById(schoolId).session(session);
      if (!school) throw AppError.notFound("School not found");
      if (school.tenantStatus !== "active") throw AppError.conflict("Only active tenants can have a new subscription");
      if (await Subscription.exists({ schoolId }).session(session)) throw AppError.conflict("Tenant already has a subscription");
      const plan = await SaaSPlan.findOne({ _id: planId, status: "active" }).session(session);
      if (!plan) throw AppError.notFound("Active SaaS plan not found");
      const trialEndsAt = plan.trialDays > 0 ? new Date(startedAt.getTime() + plan.trialDays * 86400000) : undefined;
      const status: SubscriptionStatus = plan.trialDays > 0 ? "trialing" : "active";
      const subscription = new Subscription({ schoolId, productId: plan.productId, planId: plan._id, planCode: plan.code, planVersion: plan.version, status, currency: plan.currency, amountMinor: plan.amountMinor, billingInterval: plan.billingInterval, startedAt, trialEndsAt, currentPeriodStart: startedAt, currentPeriodEnd: addBillingInterval(startedAt, plan.billingInterval), stateRevision: 0 });
      await subscription.save({ session });
      await createAuditLog({ userId: actorUserId, schoolId, action: "CREATE", entity: "Subscription", entityId: subscription._id.toString(), after: { planId: plan._id.toString(), planCode: plan.code, planVersion: plan.version, status }, ip, userAgent, session });
      created = subscription.toObject();
    });
    return created!;
  } finally {
    await session.endSession();
  }
}

export async function transitionSubscription(schoolId: string, event: SubscriptionEvent, actorUserId: string, ip?: string, userAgent?: string) {
  const session = await mongoose.startSession();
  try {
    let result: Record<string, unknown> | undefined;
    await session.withTransaction(async () => {
      const current = await Subscription.findOne({ schoolId }).session(session);
      if (!current) throw AppError.notFound("Subscription not found");
      const nextStatus = transitions[current.status][event];
      if (!nextStatus) invalidTransition(current.status, event);
      const updated = await Subscription.findOneAndUpdate({ _id: current._id, stateRevision: current.stateRevision }, { $set: { status: nextStatus, ...(nextStatus === "cancelled" ? { cancelledAt: new Date() } : {}), ...(nextStatus === "expired" ? { cancelledAt: current.cancelledAt ?? new Date() } : {}) }, $inc: { stateRevision: 1 } }, { new: true, session });
      if (!updated) throw AppError.conflict("Subscription changed concurrently; retry the transition");
      await createAuditLog({ userId: actorUserId, schoolId, action: "SUBSCRIPTION_STATE_CHANGE", entity: "Subscription", entityId: updated._id.toString(), before: { status: current.status, stateRevision: current.stateRevision }, after: { status: updated.status, stateRevision: updated.stateRevision, event }, ip, userAgent, session });
      result = updated.toObject();
    });
    return result!;
  } finally {
    await session.endSession();
  }
}

export async function changeSubscriptionPlan(schoolId: string, planId: string, actorUserId: string, ip?: string, userAgent?: string) {
  const session = await mongoose.startSession();
  try {
    let result: Record<string, unknown> | undefined;
    await session.withTransaction(async () => {
      const subscription = await Subscription.findOne({ schoolId }).session(session);
      if (!subscription) throw AppError.notFound("Subscription not found");
      if (!["trialing", "active"].includes(subscription.status)) throw AppError.conflict("Plan changes are only allowed for trialing or active subscriptions");
      const plan = await SaaSPlan.findOne({ _id: planId, status: "active" }).session(session);
      if (!plan) throw AppError.notFound("Active SaaS plan not found");
      const before = { planId: subscription.planId.toString(), planCode: subscription.planCode, planVersion: subscription.planVersion, amountMinor: subscription.amountMinor, currency: subscription.currency, billingInterval: subscription.billingInterval };
      subscription.productId = plan.productId;
      subscription.planId = plan._id;
      subscription.planCode = plan.code;
      subscription.planVersion = plan.version;
      subscription.amountMinor = plan.amountMinor;
      subscription.currency = plan.currency;
      subscription.billingInterval = plan.billingInterval;
      await subscription.save({ session });
      await createAuditLog({ userId: actorUserId, schoolId, action: "SUBSCRIPTION_PLAN_CHANGE", entity: "Subscription", entityId: subscription._id.toString(), before, after: { planId: plan._id.toString(), planCode: plan.code, planVersion: plan.version, amountMinor: plan.amountMinor, currency: plan.currency, billingInterval: plan.billingInterval }, ip, userAgent, session });
      result = subscription.toObject();
    });
    return result!;
  } finally {
    await session.endSession();
  }
}

export async function getSubscription(schoolId: string) {
  return Subscription.findOne({ schoolId }).populate("productId").populate("planId").lean();
}

export { transitions };
