import { describe, expect, it } from "vitest";
import { AdmissionEnquiryCreateSchema, AdmissionEnquiryUpdateSchema } from "./admissionEnquiry.js";

describe("admission enquiry validators", () => {
  it("defaults a new enquiry to the enquiry stage", () => {
    const result = AdmissionEnquiryCreateSchema.parse({ studentName: "Aarav Kumar", guardianName: "Parent Kumar" });
    expect(result.stage).toBe("enquiry");
  });
  it("rejects invalid email and malformed class ids", () => {
    expect(() => AdmissionEnquiryCreateSchema.parse({ studentName: "Aarav", guardianName: "Parent", email: "not-an-email" })).toThrow();
    expect(() => AdmissionEnquiryCreateSchema.parse({ studentName: "Aarav", guardianName: "Parent", classId: "bad" })).toThrow();
  });
  it("accepts the full pipeline and conversion reference", () => {
    const result = AdmissionEnquiryUpdateSchema.parse({ stage: "converted", convertedStudentId: "507f1f77bcf86cd799439011" });
    expect(result.stage).toBe("converted");
    expect(result.convertedStudentId).toBe("507f1f77bcf86cd799439011");
  });
});
