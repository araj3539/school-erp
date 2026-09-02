import { describe, expect, it } from "vitest";
import { getReceiptSchoolBranding } from "./pdf.js";

describe("receipt school branding", () => {
  it("uses the tenant school's configured identity fields", () => {
    expect(getReceiptSchoolBranding({
      name: "Sunrise Public School",
      address: "12 School Road, Patna",
      phone: "+91 9876543210",
      email: "office@sunrise.example",
    })).toEqual([
      "Sunrise Public School",
      "12 School Road, Patna",
      "Phone: +91 9876543210",
      "Email: office@sunrise.example",
    ]);
  });
});
