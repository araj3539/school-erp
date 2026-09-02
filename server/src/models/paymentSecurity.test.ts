import { describe, expect, it } from "vitest";
import { PaymentReversalSchema, CreatePaymentSchema } from "../validators/index.js";
import { Payment } from "./Payment.js";

const basePayment = {
  feeId: "66c000000000000000000001",
  studentId: "66c000000000000000000002",
  amount: 500,
  mode: "cash" as const,
  date: "2026-08-22T00:00:00.000Z",
};

describe("payment financial safeguards", () => {
  it("accepts idempotency keys and requires a positive payment amount", () => {
    const parsed = CreatePaymentSchema.parse({ ...basePayment, idempotencyKey: "payment-20260822-001" });
    expect(parsed.amount).toBe(500);
    expect(parsed.idempotencyKey).toBe("payment-20260822-001");
    expect(() => CreatePaymentSchema.parse({ ...basePayment, amount: 0 })).toThrow();
  });

  it("rejects zero and negative amounts at the persistence layer", () => {
    const zero = new Payment({ amount: 0 }).validateSync();
    const negative = new Payment({ amount: -1 }).validateSync();
    expect(zero?.errors.amount).toBeDefined();
    expect(negative?.errors.amount).toBeDefined();
    expect(Payment.schema.path("amount").options.min).toBe(0.01);
  });

  it("validates reversal amount and reason", () => {
    expect(PaymentReversalSchema.parse({ type: "refund", amount: 100, reason: "Duplicate collection" })).toEqual({ type: "refund", amount: 100, reason: "Duplicate collection" });
    expect(() => PaymentReversalSchema.parse({ type: "refund", amount: 0, reason: "x" })).toThrow();
  });

  it("defines tenant-scoped unique guards for idempotency and transaction IDs", () => {
    const indexes = Payment.schema.indexes();
    expect(indexes).toEqual(expect.arrayContaining([
      [expect.objectContaining({ schoolId: 1, idempotencyKey: 1 }), expect.objectContaining({ unique: true, sparse: true })],
      [expect.objectContaining({ schoolId: 1, transactionId: 1 }), expect.objectContaining({ unique: true, sparse: true })],
    ]));
  });
});
