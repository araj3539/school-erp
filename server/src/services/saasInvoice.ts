import mongoose from "mongoose";
import { SaaSInvoice, SaaSPlan, Subscription } from "../models/index.js";
import type { ISaaSInvoice } from "../models/SaaSInvoice.js";
import { createAuditLog } from "./auditLog.js";
import { AppError } from "../utils/errors.js";

export function invoiceNumberForId(id: mongoose.Types.ObjectId, issuedAt: Date): string {
  return `INV-${issuedAt.getUTCFullYear()}-${id.toHexString().slice(-10).toUpperCase()}`;
}

function invoiceSnapshot(subscription: any, plan: any, invoiceId: mongoose.Types.ObjectId, issuedAt: Date, periodStart: Date, periodEnd: Date) {
  const amountMinor = Number(subscription.amountMinor);
  if (!Number.isInteger(amountMinor) || amountMinor < 0) throw AppError.conflict("Subscription has an invalid authoritative invoice amount");
  return new SaaSInvoice({ _id: invoiceId, schoolId: subscription.schoolId, subscriptionId: subscription._id, invoiceNumber: invoiceNumberForId(invoiceId, issuedAt), status: "issued", currency: subscription.currency, subtotalMinor: amountMinor, totalMinor: amountMinor, lineItems: [{ description: `${plan.name} subscription`, quantity: 1, unitAmountMinor: amountMinor, amountMinor }], planCode: subscription.planCode, planVersion: subscription.planVersion, periodStart, periodEnd, issuedAt, dueAt: periodEnd });
}

export async function createInvoiceForSubscription(subscriptionId: mongoose.Types.ObjectId, session: mongoose.ClientSession): Promise<ISaaSInvoice | undefined> {
  const subscription = await Subscription.findById(subscriptionId).session(session);
  if (!subscription || subscription.amountMinor <= 0) return undefined;
  const plan = await SaaSPlan.findById(subscription.planId).session(session);
  if (!plan) throw AppError.notFound("SaaS plan for invoice was not found");
  const invoice = invoiceSnapshot(subscription, plan, new mongoose.Types.ObjectId(), new Date(), subscription.currentPeriodStart, subscription.currentPeriodEnd);
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
    } finally { await session.endSession(); }
  }
}

export async function getBillingHistory(schoolId: string, page = 1, limit = 20, status?: string) {
  await reconcileOverdueInvoices(schoolId);
  const query: Record<string, unknown> = { schoolId };
  if (status && ["issued", "paid", "overdue", "void"].includes(status)) query.status = status;
  const skip = (page - 1) * limit;
  const [invoices, total] = await Promise.all([SaaSInvoice.find(query).sort({ issuedAt: -1 }).skip(skip).limit(limit).lean(), SaaSInvoice.countDocuments(query)]);
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
  } finally { await session.endSession(); }
}
