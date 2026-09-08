import crypto from "node:crypto";
import { env } from "../config/index.js";
import { AppError } from "../utils/errors.js";

export interface RazorpayOrderResponse { id: string; amount: number; currency: string; status: string; receipt?: string; }
export interface RazorpayPaymentResponse { id: string; order_id: string; amount: number; currency: string; status: string; }
export interface RazorpayRefundResponse { id: string; payment_id: string; amount: number; status: string; }

function assertConfigured(): void {
  if (env.PAYMENT_PROVIDER !== "razorpay" || !env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) throw AppError.internal("Online payment provider is not configured", "PAYMENT_PROVIDER_UNAVAILABLE");
}
function authHeader(): string { assertConfigured(); return `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`; }
async function razorpayRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, { ...init, headers: { Authorization: authHeader(), "Content-Type": "application/json", ...(init.headers || {}) } });
  const text = await response.text(); let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { error: { description: "Invalid provider response" } }; }
  if (!response.ok) throw AppError.badRequest(body?.error?.description || `Payment provider request failed (${response.status})`);
  return body as T;
}
export function isRazorpayConfigured(): boolean { return env.PAYMENT_PROVIDER === "razorpay" && Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET); }
export async function createRazorpayOrder(input: { amount: number; currency: string; receipt: string; notes?: Record<string, string> }): Promise<RazorpayOrderResponse> {
  return razorpayRequest<RazorpayOrderResponse>("/orders", { method: "POST", body: JSON.stringify({ amount: Math.round(input.amount * 100), currency: input.currency, receipt: input.receipt, notes: input.notes }) });
}
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentResponse> { return razorpayRequest<RazorpayPaymentResponse>(`/payments/${encodeURIComponent(paymentId)}`); }
export async function createRazorpayRefund(input: { paymentId: string; amount: number; idempotencyKey: string; receipt: string }): Promise<RazorpayRefundResponse> {
  return razorpayRequest<RazorpayRefundResponse>(`/payments/${encodeURIComponent(input.paymentId)}/refund`, { method: "POST", headers: { "X-Refund-Idempotency": input.idempotencyKey }, body: JSON.stringify({ amount: Math.round(input.amount * 100), receipt: input.receipt }) });
}
export function verifyRazorpayCheckoutSignature(input: { orderId: string; paymentId: string; signature: string }): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(`${input.orderId}|${input.paymentId}`).digest("hex");
  if (expected.length !== input.signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.signature));
}
export function verifyRazorpayWebhookSignature(rawBody: Buffer, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
