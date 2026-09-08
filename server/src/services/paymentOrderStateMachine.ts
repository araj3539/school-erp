import { AppError } from "../utils/errors.js";
import { PaymentOrderStatus } from "../models/PaymentOrder.js";

const TRANSITIONS: Record<PaymentOrderStatus, readonly PaymentOrderStatus[]> = {
  created: ["pending", "cancelled", "expired"],
  pending: ["paid", "failed", "cancelled", "expired"],
  paid: ["partially_refunded", "refunded"],
  failed: [],
  expired: [],
  cancelled: [],
  partially_refunded: ["refunded"],
  refunded: []
};

export function canTransitionPaymentOrder(from: PaymentOrderStatus, to: PaymentOrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertPaymentOrderTransition(from: PaymentOrderStatus, to: PaymentOrderStatus): void {
  if (!canTransitionPaymentOrder(from, to)) {
    throw AppError.conflict(`Invalid payment order transition: ${from} -> ${to}`);
  }
}

export function isTerminalPaymentOrderStatus(status: PaymentOrderStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
