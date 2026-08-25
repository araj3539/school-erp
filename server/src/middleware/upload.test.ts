import { describe, expect, it } from "vitest";
import { validateUploadedFileSignature } from "./upload.js";

function file(mimetype: string, buffer: Buffer) {
  return { mimetype, buffer } as any;
}

describe("student document upload signature validation", () => {
  it("accepts a PDF whose bytes begin with the PDF signature", () => {
    expect(() => validateUploadedFileSignature(
      file("application/pdf", Buffer.from("%PDF-1.7\n"))
    )).not.toThrow();
  });

  it("accepts a JPEG whose bytes begin with the JPEG signature", () => {
    expect(() => validateUploadedFileSignature(
      file("image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0xe0]))
    )).not.toThrow();
  });

  it("rejects a declared PDF whose bytes are not a PDF", () => {
    expect(() => validateUploadedFileSignature(
      file("application/pdf", Buffer.from("not a pdf"))
    )).toThrowError(/do not match the declared file type/);
  });

  it("accepts supported non-signature-checked spreadsheet files", () => {
    expect(() => validateUploadedFileSignature(
      file("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", Buffer.from("not checked here"))
    )).not.toThrow();
  });
});
