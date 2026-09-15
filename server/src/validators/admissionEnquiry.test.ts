import { describe, expect, it } from "vitest";
import { AdmissionEnquiryCreateSchema, AdmissionEnquiryQuerySchema, AdmissionEnquiryUpdateSchema } from "./admissionEnquiry.js";

describe("admission enquiry validators", () => {
  it("defaults a new enquiry to the enquiry stage", () => {
    const result = AdmissionEnquiryCreateSchema.parse({ studentName: "Anaya Sharma", guardianName: "Ravi Sharma" });
    expect(result.stage).toBe("enquiry");
  });

  it("accepts every supported stage and valid ids", () => {
    const stages = ["enquiry", "contacted", "visit", "application", "documents", "assessment", "accepted", "rejected", "converted"];
    for (const stage of stages) {
      expect(AdmissionEnquiryUpdateSchema.parse({ stage, convertedStudentId: "507f1f77bcf86cd799439011" }).stage).toBe(stage);
    }
  });

  it("rejects malformed class and converted-student ids", () => {
    expect(() => AdmissionEnquiryCreateSchema.parse({ studentName: "Anaya", guardianName: "Ravi", classId: "bad" })).toThrow();
    expect(() => AdmissionEnquiryUpdateSchema.parse({ convertedStudentId: "bad" })).toThrow();
  });

  it("bounds admission search input", () => {
    expect(AdmissionEnquiryQuerySchema.parse({ stage: "assessment", search: " Anaya " }).search).toBe("Anaya");
    expect(() => AdmissionEnquiryQuerySchema.parse({ search: "x".repeat(101) })).toThrow();
  });
});
