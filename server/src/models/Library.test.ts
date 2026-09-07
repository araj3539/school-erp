import { describe, expect, it } from "vitest";
import { LibraryBook } from "./LibraryBook.js";
import { LibraryCopy } from "./LibraryCopy.js";
import { LibraryLoan } from "./LibraryLoan.js";

describe("Library persistence invariants", () => {
  it("keeps catalog and physical copies tenant-scoped", () => {
    expect(LibraryBook.schema.path("schoolId").options.required).toBe(true);
    expect(LibraryCopy.schema.path("schoolId").options.required).toBe(true);
    expect(LibraryCopy.schema.indexes().some(([fields, options]) => fields.schoolId === 1 && fields.accessionNo === 1 && options?.unique === true)).toBe(true);
  });

  it("enforces one active loan per physical copy", () => {
    const activeIndex = LibraryLoan.schema.indexes().find(([fields]) => fields.schoolId === 1 && fields.copyId === 1 && fields.activeLoan === 1);
    expect(activeIndex?.[1]).toMatchObject({ unique: true, partialFilterExpression: { activeLoan: true } });
    expect(LibraryLoan.schema.path("activeLoan").options.default).toBe(true);
  });
});
