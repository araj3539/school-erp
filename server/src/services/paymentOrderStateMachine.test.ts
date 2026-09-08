import { describe, expect, it } from "vitest";
import { AppError } from "../utils/errors.js";
import {
  assertPaymentOrderTransition,
  canTransitionPaymentOrder,
  isTerminalPaymentOrderStatus
} from "./paymentOrderStateMachine.js";

describe("payment order state machine", () => {
  it("allows the expected lifecycle transitions", () => {
    expect(canTransitionPaymentOrder("created", "pending")).toBe(true);
    expect(canTransitionPaymentOrder("pending", "paid")).toBe(true);
    expect(canTransitionPaymentOrder("paid", "partially_refunded")).toBe(true);
    expect(canTransitionPaymentOrder("partially_refunded", "refunded")).toBe(true);
  });

  it("rejects transitions that could rewrite terminal or authoritative state", () => {
    expect(canTransitionPaymentOrder("paid", "pending")).toBe(false);
    expect(canTransitionPaymentOrder("failed", "paid")).toBe(false);
    expect(canTransitionPaymentOrder("refunded", "paid")).toBe(false);
    expect(() => assertPaymentOrderTransition("paid", "pending")).toThrow(AppError);
  });

  it("identifies terminal states", () => {
    expect(isTerminalPaymentOrderStatus("failed")).toBe(true);
    expect(isTerminalPaymentOrderStatus("expired")).toBe(true);
    expect(isTerminalPaymentOrderStatus("cancelled")).toBe(true);
    expect(isTerminalPaymentOrderStatus("refunded")).toBe(true);
    expect(isTerminalPaymentOrderStatus("pending")).toBe(false);
  });
});
