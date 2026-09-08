import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPaymentWebhookEvent extends Document {
  provider: string;
  eventId: string;
  eventType: string;
  receivedAt: Date;
  processedAt?: Date;
  status: "received" | "processed" | "ignored" | "failed";
  paymentOrderId?: Types.ObjectId;
  errorMessage?: string;
}

const PaymentWebhookEventSchema = new Schema<IPaymentWebhookEvent>({
  provider: { type: String, required: true, maxlength: 50 },
  eventId: { type: String, required: true, maxlength: 200 },
  eventType: { type: String, required: true, maxlength: 100 },
  receivedAt: { type: Date, required: true, default: Date.now },
  processedAt: { type: Date },
  status: { type: String, required: true, enum: ["received", "processed", "ignored", "failed"], default: "received" },
  paymentOrderId: { type: Schema.Types.ObjectId, ref: "PaymentOrder" },
  errorMessage: { type: String, maxlength: 500 }
}, { timestamps: false });

PaymentWebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
PaymentWebhookEventSchema.index({ provider: 1, receivedAt: -1 });

export const PaymentWebhookEvent = mongoose.model<IPaymentWebhookEvent>("PaymentWebhookEvent", PaymentWebhookEventSchema);
