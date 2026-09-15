import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { FeeItem } from "./FeeItem.js";

describe("FeeItem financial invariants", () => {
  const base = () => ({
    schoolId: new mongoose.Types.ObjectId(),
    studentId: new mongoose.Types.ObjectId(),
    feeId: new mongoose.Types.ObjectId(),
    feeHeadId: new mongoose.Types.ObjectId(),
    academicYear: new mongoose.Types.ObjectId(),
    label: "Tuition",
    amount: 1000,
    discount: 100,
    fine: 50,
    totalDue: 950,
    paidAmount: 400,
    balance: 550
  });

  it("accepts exact amount, discount, fine, paid and balance arithmetic", async () => {
    await expect(new FeeItem(base()).validate()).resolves.toBeUndefined();
  });

  it("rejects forged totalDue arithmetic", async () => {
    await expect(new FeeItem({ ...base(), totalDue: 900 }).validate()).rejects.toThrow("totalDue must equal amount - discount + fine");
  });

  it("rejects forged balance arithmetic", async () => {
    await expect(new FeeItem({ ...base(), balance: 500 }).validate()).rejects.toThrow("balance must equal totalDue - paidAmount");
  });

  it("rejects a negative effective total", async () => {
    await expect(new FeeItem({ ...base(), discount: 1100, totalDue: 0, balance: 0 }).validate()).rejects.toThrow();
  });

  it("rejects paid amount greater than total due", async () => {
    await expect(new FeeItem({ ...base(), paidAmount: 1000, balance: -50 }).validate()).rejects.toThrow();
  });

  it("defines the school/student/fee-head allocation uniqueness invariant", () => {
    const indexes = FeeItem.schema.indexes();
    expect(indexes.some(([keys, options]) =>
      keys.schoolId === 1 && keys.studentId === 1 && keys.feeId === 1 && keys.feeHeadId === 1 && options.unique === true
    )).toBe(true);
  });
});
