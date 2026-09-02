import { describe, expect, it } from "vitest";
import { getRemainingReversibleAmount } from "./paymentController.js";

function expectBadRequest(fn: () => unknown) {
  expect(fn).toThrow("Reversal/refund exceeds remaining payment amount");
}

describe("payment reversal bounds", () => {
  it("allows a partial reversal and reports the remaining amount", () => {
    expect(getRemainingReversibleAmount(1000, 0, 250)).toBe(750);
  });

  it("allows the final reversal to consume the exact remaining amount", () => {
    expect(getRemainingReversibleAmount(1000, 250, 750)).toBe(0);
  });

  it("rejects a reversal larger than the remaining payment", () => {
    expectBadRequest(() => getRemainingReversibleAmount(1000, 250, 751));
  });

  it("rejects a reversal after the payment has already been fully reversed", () => {
    expectBadRequest(() => getRemainingReversibleAmount(1000, 1000, 1));
  });
});
