import { describe, expect, it } from "vitest";
import { validateUploadedFileSignature } from "./upload.js";

function request(url: string) {
  return { url } as any;
}

function file(mimetype: string, buffer: Buffer) {
  return { mimetype, buffer } as any;
}

describe("student document upload signature validation", () => {
  it("accepts a PDF whose bytes begin with the PDF signature", () => {
    expect(() => validateUploadedFileSignature(
      request("/documents/123"),
      file("application/pdf", Buffer.from("%PDF-1.7\n"))
    )).not.toThrow();
  });

  it("accepts a JPEG whose bytes begin with the JPEG signature", () => {
    expect(() => validateUploadedFileSignature(
      request("/documents/123"),
      file("image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0xe0]))
    )).not.toThrow();
  });

  it("rejects a declared PDF whose bytes are not a PDF", () => {
    expect(() => validateUploadedFileSignature(
      request("/documents/123"),
      file("application/pdf", Buffer.from("not a pdf"))
    )).toThrowError(/do not match the declared file type/);
  });

  it("does not apply document signature validation to spreadsheet imports", () => {
    expect(() => validateUploadedFileSignature(
      request("/bulk-import"),
      file("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", Buffer.from("not checked here"))
    )).not.toThrow();
  });
});