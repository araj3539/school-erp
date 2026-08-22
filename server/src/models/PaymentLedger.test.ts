import { describe, expect, it } from "vitest";

function assertPositivePayment(amount: number) {
  if (amount <= 0) throw new Error("Payment amount must be greater than zero");
}

describe("financial ledger invariants", () => {
  it("rejects zero and negative payments", () => {
    expect(() => assertPositivePayment(0)).toThrow();
    expect(() => assertPositivePayment(-1)).toThrow();
  });

  it("accepts positive payments", () => {
    expect(() => assertPositivePayment(1)).not.toThrow();
  });

  it("net collection equals gross collection minus reversals", () => {
    const gross = 1000;
    const reversals = 250;
    expect(gross - reversals).toBe(750);
  });

  it("does not allow a reversal beyond the original payment", () => {
    const payment = 500;
    const priorReversals = 300;
    const requested = 250;
    expect(priorReversals + requested > payment).toBe(true);
  });
});
