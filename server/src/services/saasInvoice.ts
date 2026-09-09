import mongoose from "mongoose";
import { SaaSInvoice, SaaSPlan, Subscription } from "../models/index.js";
import type { ISaaSInvoice } from "../models/SaaSInvoice.js";
import { createAuditLog } from "./auditLog.js";
import { AppError } from "../utils/errors.js";

export function invoiceNumberForId(id: mongoose.Types.ObjectId, issuedAt: Date): string {
  return `INV-${issuedAt.getUTCFullYear()}-${id.toHexString().slice(-10).toUpperCase()}`;
}

function providerDate(value: unknown, fallback: Date): Date {
  const seconds = Number(value || 0);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000) : fallback;
}

function invoiceSnapshot(subscription: any, plan: any, invoiceId: mongoose.Types.ObjectId, issuedAt: Date, periodStart: Date, periodEnd: Date) {
  const amountMinor = Number(subscription.amountMinor);
  if (!Number.isInteger(amountMinor) || amountMinor < 0) throw AppError.conflict("Subscription has an invalid authoritative invoice amount");
  return new SaaSInvoice({
    _id: invoiceId,
    schoolId: subscription.schoolId,
    subscriptionId: subscription._id,
    invoiceNumber: invoiceNumberForId(invoiceId, issuedAt),
    status: "issued",
    currency: subscription.currency,
    subtotalMinor: amountMinor,
    totalMinor: amountMinor,
    lineItems: [{ description: `${plan.name} subscription`, quantity: 1, unitAmountMinor: amountMinor, amountMinor }],
    planCode: subscription.planCode,
    planVersion: subscription.planVersion,
    periodStart,
    periodEnd,
    issuedAt,
    dueAt: periodEnd,
    provider: subscription.provider,
    providerSubscriptionId: subscription.providerSubscriptionId,
  });
}

export async function createInvoiceForSubscription(subscriptionId: mongoose.Types.ObjectId, session: mongoose.ClientSession): Promise<ISaaSInvoice | undefined> {
  const subscription = await Subscription.findById(subscriptionId).session(session);
  if (!subscription || subscription.amountMinor <= 0) return undefined;
  const plan = await SaaSPlan.findById(subscription.planId).session(session);
  if (!plan) throw AppError.notFound("SaaS plan for invoice was not found");
  const issuedAt = new Date();
  const invoice = invoiceSnapshot(subscription, plan, new mongoose.Types.ObjectId(), issuedAt, subscription.currentPeriodStart, subscription.currentPeriodEnd);
  try {
    await invoice.save({ session });
  } catch (error: any) {
    if (error?.code === 11000) {
      const existing = await SaaSInvoice.findOne({ subscriptionId: subscription._id, periodStart: subscription.currentPeriodStart, periodEnd: subscription.currentPeriodEnd }).session(session);
      if (existing) return existing;
    }
    throw error;
  }
  await createAuditLog({ actorType: "system", schoolId: subscription.schoolId.toString(), action: "CREATE", entity: "SaaSInvoice", entityId: invoice._id.toString(), after: { invoiceNumber: invoice.invoiceNumber, status: invoice.status, totalMinor: invoice.totalMinor, currency: invoice.currency }, session });
  return invoice;
}

export async function recordSubscriptionCharge(body: any, session: mongoose.ClientSession): Promise<mongoose.Types.ObjectId | undefined> {
  const providerSubscription = body?.payload?.subscription?.entity;
  const providerPayment = body?.payload?.payment?.entity;
  const providerSubscriptionId = String(providerSubscription?.id || "").trim();
  const providerPaymentId = String(providerPayment?.id || "").trim();
  if (!providerSubscriptionId || !providerPaymentId) return undefined;

  const subscription = await Subscription.findOne({ provider: "razorpay", providerSubscriptionId }).session(session);
  if (!subscription) throw AppError.notFound("Subscription for provider charge was not found");

  const amountMinor = Number(providerPayment?.amount || 0);
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) throw AppError.conflict("Provider charge has an invalid amount");
  if (amountMinor !== subscription.amountMinor) throw AppError.conflict("Provider charge does not match the authoritative subscription amount");

  const periodStart = providerDate(providerSubscription?.current_start, subscription.currentPeriodStart);
  const periodEnd = providerDate(providerSubscription?.current_end, subscription.currentPeriodEnd);
  let invoice = await SaaSInvoice.findOne({ subscriptionId: subscription._id, periodStart, periodEnd }).session(session);
  if (!invoice) {
    const plan = await SaaSPlan.findById(subscription.planId).session(session);
    if (!plan) throw AppError.notFound("SaaS plan for provider charge was not found");
    const issuedAt = providerDate(body?.created_at, new Date());
    const invoiceId = new mongoose.Types.ObjectId();
    invoice = invoiceSnapshot(subscription, plan, invoiceId, issuedAt, periodStart, periodEnd);
    invoice.status = "paid";
    invoice.providerPaymentId = providerPaymentId;
    invoice.paidAt = providerDate(body?.created_at, new Date());
    try {
      await invoice.save({ session });
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      invoice = await SaaSInvoice.findOne({ subscriptionId: subscription._id, periodStart, periodEnd }).session(session);
      if (!invoice) throw error;
    }
  }

  if (!invoice) throw AppError.internal("Invoice could not be resolved after provider charge");
  if (invoice.totalMinor !== amountMinor) throw AppError.conflict("Provider charge does not match the invoice amount");
  if (invoice.status === "void") throw AppError.conflict("A void invoice cannot be marked paid");
  if (invoice.status !== "paid") {
    const before = { status: invoice.status, paidAt: invoice.paidAt, providerPaymentId: invoice.providerPaymentId };
    invoice.status = "paid";
    invoice.paidAt = providerDate(body?.created_at, new Date());
    invoice.providerPaymentId = providerPaymentId;
    await invoice.save({ session });
    await createAuditLog({ actorType: "system", schoolId: subscription.schoolId.toString(), action: "INVOICE_PAID", entity: "SaaSInvoice", entityId: invoice._id.toString(), before, after: { status: invoice.status, paidAt: invoice.paidAt, providerPaymentId }, session });
  } else if (invoice.providerPaymentId !== providerPaymentId) {
    throw AppError.conflict("Invoice is already associated with a different provider payment");
  }
  return invoice._id;
}

export function effectiveInvoiceStatus(invoice: Pick<ISaaSInvoice, "status" | "dueAt">, now = new Date()): ISaaSInvoice["status"] {
  if (invoice.status === "issued" && invoice.dueAt < now) return "overdue";
  return invoice.status;
}

export async function reconcileOverdueInvoices(schoolId: string): Promise<void> {
  const now = new Date();
  const invoices = await SaaSInvoice.find({ schoolId, status: "issued", dueAt: { $lt: now } }).select("_id status dueAt").lean();
  for (const invoice of invoices) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const updated = await SaaSInvoice.findOneAndUpdate({ _id: invoice._id, schoolId, status: "issued", dueAt: { $lt: now } }, { $set: { status: "overdue" } }, { new: true, session });
        if (!updated) return;
        await createAuditLog({ actorType: "system", schoolId, action: "INVOICE_OVERDUE", entity: "SaaSInvoice", entityId: updated._id.toString(), before: { status: "issued" }, after: { status: "overdue" }, session });
      });
    } finally {
      await session.endSession();
    }
  }
}

export async function getBillingHistory(schoolId: string, page = 1, limit = 20, status?: string) {
  await reconcileOverdueInvoices(schoolId);
  const query: Record<string, unknown> = { schoolId };
  if (status && ["issued", "paid", "overdue", "void"].includes(status)) query.status = status;
  const skip = (page - 1) * limit;
  const [invoices, total] = await Promise.all([
    SaaSInvoice.find(query).sort({ issuedAt: -1 }).skip(skip).limit(limit).lean(),
    SaaSInvoice.countDocuments(query),
  ]);
  return { invoices, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function voidInvoice(invoiceId: string, actorUserId: string, ip?: string, userAgent?: string) {
  if (!mongoose.isValidObjectId(invoiceId)) throw AppError.badRequest("Invalid invoice id");
  const session = await mongoose.startSession();
  try {
    let result: Record<string, unknown> | undefined;
    await session.withTransaction(async () => {
      const invoice = await SaaSInvoice.findById(invoiceId).session(session);
      if (!invoice) throw AppError.notFound("Invoice not found");
      if (invoice.status === "paid") throw AppError.conflict("Paid invoices cannot be voided");
      if (invoice.status === "void") { result = invoice.toObject() as unknown as Record<string, unknown>; return; }
      const before = { status: invoice.status };
      invoice.status = "void";
      invoice.voidedAt = new Date();
      await invoice.save({ session });
      await createAuditLog({ userId: actorUserId, schoolId: invoice.schoolId.toString(), action: "INVOICE_VOID", entity: "SaaSInvoice", entityId: invoice._id.toString(), before, after: { status: invoice.status, voidedAt: invoice.voidedAt }, ip, userAgent, session });
      result = invoice.toObject() as unknown as Record<string, unknown>;
    });
    return result!;
  } finally {
    await session.endSession();
  }
}
