import { describe, expect, it } from "vitest";
import { CreateLibraryBookSchema, CreateLibraryCopySchema, IssueLibraryLoanSchema, LibraryBorrowerType, LibraryCopyStatus, LibraryLoanStatus } from "./phase10.js";

const objectId = "507f1f77bcf86cd799439011";

describe("Library contracts", () => {
  it("accepts catalog and copy creation payloads", () => {
    expect(CreateLibraryBookSchema.parse({ title: "Mathematics", author: "A. Teacher", publicationYear: 2024 }).title).toBe("Mathematics");
    const copy = CreateLibraryCopySchema.parse({ bookId: objectId, accessionNo: "LIB-001" });
    expect(copy.status).toBe(LibraryCopyStatus.AVAILABLE);
  });

  it("rejects invalid circulation and preserves borrower lifecycle enums", () => {
    expect(() => IssueLibraryLoanSchema.parse({ copyId: objectId, borrowerType: LibraryBorrowerType.STUDENT, borrowerId: objectId, dueAt: "2020-01-01T00:00:00.000Z" })).toThrow();
    expect(LibraryLoanStatus.OVERDUE).toBe("overdue");
  });
});
