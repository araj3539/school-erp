import mongoose from "mongoose";
import { ModuleEntitlement, SaaSPlan, SaaSProduct, School, Subscription } from "../models/index.js";
import { createAuditLog } from "./auditLog.js";
import { recordSubscriptionCharge, createInvoiceForSubscription } from "./saasInvoice.js";
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
type RazorpaySubscriptionEvent = "authenticated" | "activated" | "charged" | "completed" | "updated" | "pending" | "halted" | "paused" | "resumed" | "cancelled" | "expired";

const subscriptionEventToCommand: Record<Exclude<RazorpaySubscriptionEvent, "authenticated" | "updated" | "charged">, SubscriptionEvent> = {
  activated: "activate",
  completed: "expire",
  pending: "mark_past_due",
  halted: "suspend",
  paused: "suspend",
  resumed: "recover",
  cancelled: "cancel",
  expired: "expire",
};

export function getNextSubscriptionStatus(status: SubscriptionStatus, event: SubscriptionEvent): SubscriptionStatus {
  const nextStatus = transitions[status][event];
  if (!nextStatus) throw AppError.conflict(`Invalid subscription transition: ${status} -> ${event}`);
  return nextStatus;
}

function addBillingInterval(date: Date, interval: "month" | "year"): Date {
  const result = new Date(date);
  if (interval === "month") result.setUTCMonth(result.getUTCMonth() + 1);
  else result.setUTCFullYear(result.getUTCFullYear() + 1);
  return result;
}

function providerStatusCommand(status: string): SubscriptionEvent | undefined {
  if (status === "active") return "activate";
  if (status === "pending") return "mark_past_due";
  if (status === "halted" || status === "paused") return "suspend";
  if (status === "cancelled") return "cancel";
  if (status === "completed" || status === "expired") return "expire";
  return undefined;
}

function providerEventDate(body: any): Date {
  const timestamp = Number(body?.created_at || 0);
  return Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp * 1000) : new Date();
}

async function syncSubscriptionEntitlements(subscription: any, plan: any, session: mongoose.ClientSession): Promise<void> {
  const hasAccess = ["trialing", "active", "past_due"].includes(subscription.status);
  if (!hasAccess) {
    await ModuleEntitlement.updateMany({ schoolId: subscription.schoolId, enabled: true }, { $set: { enabled: false } }, { session });
    return;
  }

  const includedModules: string[] = Array.from(new Set((plan.includedModules || []) as string[]));
  await ModuleEntitlement.updateMany({ schoolId: subscription.schoolId, enabled: true, moduleId: { $nin: includedModules } }, { $set: { enabled: false } }, { session });
  if (includedModules.length > 0) {
    await ModuleEntitlement.bulkWrite(
      includedModules.map((moduleId) => ({
        updateOne: {
          filter: { schoolId: subscription.schoolId, moduleId },
          update: { $set: { enabled: true } },
          upsert: true,
        },
      })),
      { session },
    );
  }
}

export async function applyRazorpaySubscriptionWebhook(
  body: any,
  eventType: string,
  session: mongoose.ClientSession,
): Promise<mongoose.Types.ObjectId | undefined> {
  const providerSubscription = body?.payload?.subscription?.entity;
  const providerSubscriptionId = String(providerSubscription?.id || "").trim();
  if (!providerSubscriptionId) throw AppError.badRequest("Subscription webhook is missing the provider subscription id");

  const subscription = await Subscription.findOne({ provider: "razorpay", providerSubscriptionId }).session(session);
  if (!subscription) throw AppError.notFound("Subscription for provider webhook was not found");

  const eventDate = providerEventDate(body);
  if (subscription.lastBillingEventAt && eventDate <= subscription.lastBillingEventAt) return subscription._id;

  const eventName = eventType.replace("subscription.", "") as RazorpaySubscriptionEvent;
  let command: SubscriptionEvent | undefined;
  if (eventName === "updated") command = providerStatusCommand(String(providerSubscription?.status || ""));
  else if (eventName === "charged") command = "activate";
  else if (eventName !== "authenticated") command = subscriptionEventToCommand[eventName as Exclude<RazorpaySubscriptionEvent, "authenticated" | "updated" | "charged">];

  const beforeStatus = subscription.status;
  let nextStatus = subscription.status;
  if (command) {
    if (command === "activate" && subscription.status === "active") nextStatus = "active";
    else if (command === "recover" && subscription.status === "active") nextStatus = "active";
    else if (command === "mark_past_due" && subscription.status === "past_due") nextStatus = "past_due";
    else if (command === "suspend" && subscription.status === "suspended") nextStatus = "suspended";
    else if (command === "cancel" && subscription.status === "cancelled") nextStatus = "cancelled";
    else if (command === "expire" && subscription.status === "expired") nextStatus = "expired";
    else nextStatus = getNextSubscriptionStatus(subscription.status, command);
  }

  subscription.provider = "razorpay";
  subscription.providerPlanId = String(providerSubscription?.plan_id || subscription.providerPlanId || "");
  subscription.lastBillingEventAt = eventDate;
  if (nextStatus !== subscription.status) {
    subscription.status = nextStatus;
    subscription.stateRevision += 1;
    if (nextStatus === "cancelled") subscription.cancelledAt = new Date();
    if (nextStatus === "expired" && !subscription.cancelledAt) subscription.cancelledAt = new Date();
  }

  const currentStart = Number(providerSubscription?.current_start || 0);
  const currentEnd = Number(providerSubscription?.current_end || 0);
  if (currentStart > 0) subscription.currentPeriodStart = new Date(currentStart * 1000);
  if (currentEnd > 0) subscription.currentPeriodEnd = new Date(currentEnd * 1000);

  const plan = await SaaSPlan.findOne({ _id: subscription.planId, status: "active" }).session(session);
  if (!plan) throw AppError.notFound("Active SaaS plan for provider subscription was not found");
  await subscription.save({ session });
  await syncSubscriptionEntitlements(subscription, plan, session);
  if (eventName === "charged") await recordSubscriptionCharge(body, session);

  await createAuditLog({
    actorType: "system",
    schoolId: subscription.schoolId.toString(),
    action: "BILLING_WEBHOOK",
    entity: "Subscription",
    entityId: subscription._id.toString(),
    before: { status: beforeStatus, stateRevision: subscription.stateRevision - (nextStatus !== beforeStatus ? 1 : 0) },
    after: { status: subscription.status, stateRevision: subscription.stateRevision, provider: "razorpay", providerSubscriptionId, eventType },
    session,
  });

  return subscription._id;
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
    let created: Record<string, unknown> | undefined;
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
      await createInvoiceForSubscription(subscription._id, session);
      await createAuditLog({ userId: actorUserId, schoolId, action: "CREATE", entity: "Subscription", entityId: subscription._id.toString(), after: { planId: plan._id.toString(), planCode: plan.code, planVersion: plan.version, status }, ip, userAgent, session });
      created = subscription.toObject() as unknown as Record<string, unknown>;
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
      const nextStatus = getNextSubscriptionStatus(current.status, event);
      const updated = await Subscription.findOneAndUpdate({ _id: current._id, stateRevision: current.stateRevision }, { $set: { status: nextStatus, ...(nextStatus === "cancelled" ? { cancelledAt: new Date() } : {}), ...(nextStatus === "expired" ? { cancelledAt: current.cancelledAt ?? new Date() } : {}) }, $inc: { stateRevision: 1 } }, { new: true, session });
      if (!updated) throw AppError.conflict("Subscription changed concurrently; retry the transition");
      await createAuditLog({ userId: actorUserId, schoolId, action: "SUBSCRIPTION_STATE_CHANGE", entity: "Subscription", entityId: updated._id.toString(), before: { status: current.status, stateRevision: current.stateRevision }, after: { status: updated.status, stateRevision: updated.stateRevision, event }, ip, userAgent, session });
      result = updated.toObject() as unknown as Record<string, unknown>;
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
      result = subscription.toObject() as unknown as Record<string, unknown>;
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