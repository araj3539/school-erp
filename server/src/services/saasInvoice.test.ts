import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { effectiveInvoiceStatus, invoiceNumberForId } from "./saasInvoice.js";

describe("SaaS invoice lifecycle", () => {
  it("generates a stable human-readable invoice number from immutable identity", () => {
    const id = new mongoose.Types.ObjectId("68c1a4d2b7c6e9f102030405");
    const issuedAt = new Date("2026-09-10T12:00:00.000Z");
    expect(invoiceNumberForId(id, issuedAt)).toBe("INV-2026-9F102030405".replace("9F", "9F"));
    expect(invoiceNumberForId(id, issuedAt)).toBe(invoiceNumberForId(id, issuedAt));
  });

  it("marks an issued invoice overdue only after its due date", () => {
    const dueAt = new Date("2026-09-10T12:00:00.000Z");
    expect(effectiveInvoiceStatus({ status: "issued", dueAt }, new Date("2026-09-10T11:59:59.999Z"))).toBe("issued");
    expect(effectiveInvoiceStatus({ status: "issued", dueAt }, new Date("2026-09-10T12:00:00.001Z"))).toBe("overdue");
  });

  it("never changes paid or void invoices based on time", () => {
    const past = new Date("2026-01-01T00:00:00.000Z");
    expect(effectiveInvoiceStatus({ status: "paid", dueAt: past }, new Date("2026-09-10T00:00:00.000Z"))).toBe("paid");
    expect(effectiveInvoiceStatus({ status: "void", dueAt: past }, new Date("2026-09-10T00:00:00.000Z"))).toBe("void");
  });
});
