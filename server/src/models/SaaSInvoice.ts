import mongoose, { Document, Schema, Types } from "mongoose";

export const SAAS_INVOICE_STATUSES = ["issued", "paid", "overdue", "void"] as const;
export type SaaSInvoiceStatus = (typeof SAAS_INVOICE_STATUSES)[number];

export interface ISaaSInvoiceLineItem {
  description: string;
  quantity: number;
  unitAmountMinor: number;
  amountMinor: number;
}

export interface ISaaSInvoice extends Document {
  schoolId: Types.ObjectId;
  subscriptionId: Types.ObjectId;
  invoiceNumber: string;
  status: SaaSInvoiceStatus;
  currency: string;
  subtotalMinor: number;
  totalMinor: number;
  lineItems: ISaaSInvoiceLineItem[];
  planCode: string;
  planVersion: number;
  periodStart: Date;
  periodEnd: Date;
  issuedAt: Date;
  dueAt: Date;
  paidAt?: Date;
  voidedAt?: Date;
  provider?: string;
  providerSubscriptionId?: string;
  providerPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceLineItemSchema = new Schema<ISaaSInvoiceLineItem>({
  description: { type: String, required: true, trim: true, maxlength: 200, immutable: true },
  quantity: { type: Number, required: true, min: 0.000001, immutable: true },
  unitAmountMinor: { type: Number, required: true, min: 0, immutable: true },
  amountMinor: { type: Number, required: true, min: 0, immutable: true },
}, { _id: false });

const SaaSInvoiceSchema = new Schema<ISaaSInvoice>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, immutable: true },
  subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", required: true, immutable: true },
  invoiceNumber: { type: String, required: true, unique: true, immutable: true, trim: true, maxlength: 40 },
  status: { type: String, required: true, enum: SAAS_INVOICE_STATUSES, default: "issued" },
  currency: { type: String, required: true, uppercase: true, match: /^[A-Z]{3}$/, immutable: true },
  subtotalMinor: { type: Number, required: true, min: 0, immutable: true },
  totalMinor: { type: Number, required: true, min: 0, immutable: true },
  lineItems: { type: [InvoiceLineItemSchema], required: true, immutable: true },
  planCode: { type: String, required: true, trim: true, lowercase: true, immutable: true },
  planVersion: { type: Number, required: true, min: 1, immutable: true },
  periodStart: { type: Date, required: true, immutable: true },
  periodEnd: { type: Date, required: true, immutable: true },
  issuedAt: { type: Date, required: true, immutable: true },
  dueAt: { type: Date, required: true, immutable: true },
  paidAt: { type: Date },
  voidedAt: { type: Date },
  provider: { type: String, maxlength: 50, immutable: true },
  providerSubscriptionId: { type: String, maxlength: 150, immutable: true },
  providerPaymentId: { type: String, maxlength: 150 },
}, { timestamps: true });

SaaSInvoiceSchema.index({ schoolId: 1, issuedAt: -1 }, { name: "schoolId_1_issuedAt_-1" });
SaaSInvoiceSchema.index({ schoolId: 1, status: 1, dueAt: 1 }, { name: "schoolId_1_status_1_dueAt_1" });
SaaSInvoiceSchema.index({ subscriptionId: 1, periodStart: 1, periodEnd: 1 }, { unique: true, name: "subscriptionId_1_periodStart_1_periodEnd_1_unique" });
SaaSInvoiceSchema.index({ provider: 1, providerPaymentId: 1 }, { unique: true, sparse: true, name: "provider_1_providerPaymentId_1_unique" });

SaaSInvoiceSchema.pre("validate", function () {
  if (this.totalMinor !== this.subtotalMinor) throw new Error("SaaS invoice total must equal subtotal");
  const calculated = this.lineItems.reduce((sum, item) => sum + item.amountMinor, 0);
  if (calculated !== this.totalMinor) throw new Error("SaaS invoice line items must equal total");
  if (this.periodEnd <= this.periodStart) throw new Error("SaaS invoice period must end after it starts");
  if (this.dueAt < this.issuedAt) throw new Error("SaaS invoice due date cannot precede issue date");
});

export const SaaSInvoice = mongoose.model<ISaaSInvoice>("SaaSInvoice", SaaSInvoiceSchema);
