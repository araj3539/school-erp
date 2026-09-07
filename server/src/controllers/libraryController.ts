import { Request, Response, NextFunction } from "express";
import { LibraryBookStatus, LibraryBorrowerType, LibraryCopyStatus, LibraryLoanStatus, StudentStatus, StaffStatus } from "@school-erp/shared";
import { LibraryBook } from "../models/LibraryBook.js";
import { LibraryCopy } from "../models/LibraryCopy.js";
import { LibraryLoan } from "../models/LibraryLoan.js";
import { Student } from "../models/Student.js";
import { Staff } from "../models/Staff.js";
import { CreateLibraryBookSchema, UpdateLibraryBookSchema, LibraryBookQuerySchema, CreateLibraryCopySchema, UpdateLibraryCopySchema, LibraryCopyQuerySchema, IssueLibraryLoanSchema, ReturnLibraryLoanSchema, LibraryLoanQuerySchema, IdParamSchema } from "../validators/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { escapeRegex } from "../utils/strings.js";
import { getTenantId, withTenant } from "../utils/tenant.js";

function calculateFine(dueAt: Date, returnedAt: Date, dailyFineRate: number): number {
  const overdueMs = returnedAt.getTime() - dueAt.getTime();
  if (overdueMs <= 0 || dailyFineRate <= 0) return 0;
  const overdueDays = Math.ceil(overdueMs / 86400000);
  return Math.max(0, overdueDays * dailyFineRate);
}

function loanView(loan: Record<string, any>) {
  const status = loan.activeLoan && new Date(loan.dueAt).getTime() < Date.now() ? LibraryLoanStatus.OVERDUE : loan.status;
  return { ...loan, status };
}

export async function getBooks(req: Request, res: Response, next: NextFunction) {
  try {
    const query = LibraryBookQuerySchema.parse(req.query);
    const schoolId = getTenantId(req);
    const dbQuery: Record<string, any> = { schoolId };
    if (query.status) dbQuery.status = query.status;
    if (query.category) dbQuery.category = query.category;
    if (query.search) {
      const escaped = escapeRegex(query.search);
      dbQuery.$or = [{ title: { $regex: escaped, $options: "i" } }, { author: { $regex: escaped, $options: "i" } }, { isbn: { $regex: escaped, $options: "i" } }];
    }
    const skip = (query.page - 1) * query.limit;
    const [books, total] = await Promise.all([LibraryBook.find(dbQuery).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(), LibraryBook.countDocuments(dbQuery)]);
    res.json({ data: books, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
  } catch (error) { next(error); }
}

export async function getBookById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = IdParamSchema.parse(req.params);
    const book = await LibraryBook.findOne({ _id: id, schoolId: getTenantId(req) }).lean();
    if (!book) throw AppError.notFound("Library book not found");
    res.json({ book });
  } catch (error) { next(error); }
}

export async function createBook(req: Request, res: Response, next: NextFunction) {
  try {
    const data = withTenant(req, CreateLibraryBookSchema.parse(req.body) as any);
    if (data.isbn && await LibraryBook.exists({ schoolId: data.schoolId, isbn: data.isbn, status: LibraryBookStatus.ACTIVE })) throw AppError.conflict("ISBN already exists in this school library");
    const book = await LibraryBook.create(data);
    await createAuditLog({ userId: req.user!.userId, action: "CREATE", entity: "LibraryBook", entityId: book._id.toString(), after: { title: book.title, author: book.author, isbn: book.isbn } });
    res.status(201).json({ book: book.toObject() });
  } catch (error) { next(error); }
}

export async function updateBook(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = IdParamSchema.parse(req.params);
    const data = UpdateLibraryBookSchema.parse(req.body) as any;
    const schoolId = getTenantId(req);
    const current = await LibraryBook.findOne({ _id: id, schoolId });
    if (!current) throw AppError.notFound("Library book not found");
    if (data.isbn && data.isbn !== current.isbn && await LibraryBook.exists({ schoolId, isbn: data.isbn, _id: { $ne: id }, status: LibraryBookStatus.ACTIVE })) throw AppError.conflict("ISBN already exists in this school library");
    if (data.status === LibraryBookStatus.INACTIVE && data.status !== current.status && await LibraryCopy.exists({ schoolId, bookId: id, status: LibraryCopyStatus.ISSUED })) throw AppError.conflict("Cannot deactivate a book with issued copies");
    Object.assign(current, data);
    await current.save();
    await createAuditLog({ userId: req.user!.userId, action: "UPDATE", entity: "LibraryBook", entityId: id, after: data });
    res.json({ book: current.toObject() });
  } catch (error) { next(error); }
}

export async function deactivateBook(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = IdParamSchema.parse(req.params);
    const schoolId = getTenantId(req);
    const book = await LibraryBook.findOne({ _id: id, schoolId });
    if (!book) throw AppError.notFound("Library book not found");
    if (await LibraryCopy.exists({ schoolId, bookId: id, status: LibraryCopyStatus.ISSUED })) throw AppError.conflict("Cannot deactivate a book with issued copies");
    book.status = LibraryBookStatus.INACTIVE;
    await book.save();
    await createAuditLog({ userId: req.user!.userId, action: "DELETE", entity: "LibraryBook", entityId: id, after: { status: LibraryBookStatus.INACTIVE } });
    res.json({ message: "Library book deactivated" });
  } catch (error) { next(error); }
}

export async function getCopies(req: Request, res: Response, next: NextFunction) {
  try {
    const query = LibraryCopyQuerySchema.parse(req.query);
    const schoolId = getTenantId(req);
    const dbQuery: Record<string, any> = { schoolId };
    if (query.bookId) dbQuery.bookId = query.bookId;
    if (query.status) dbQuery.status = query.status;
    if (query.search) dbQuery.accessionNo = { $regex: escapeRegex(query.search), $options: "i" };
    const skip = (query.page - 1) * query.limit;
    const [copies, total] = await Promise.all([LibraryCopy.find(dbQuery).populate({ path: "bookId", select: "title author isbn" }).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(), LibraryCopy.countDocuments(dbQuery)]);
    res.json({ data: copies, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
  } catch (error) { next(error); }
}

export async function createCopy(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: bookId } = IdParamSchema.parse(req.params);
    const data = CreateLibraryCopySchema.parse({ ...req.body, bookId });
    const schoolId = getTenantId(req);
    if (!await LibraryBook.exists({ _id: bookId, schoolId, status: LibraryBookStatus.ACTIVE })) throw AppError.notFound("Active library book not found");
    if (await LibraryCopy.exists({ schoolId, accessionNo: data.accessionNo })) throw AppError.conflict("Accession number already exists in this school library");
    const copy = await LibraryCopy.create(withTenant(req, data as any));
    await createAuditLog({ userId: req.user!.userId, action: "CREATE", entity: "LibraryCopy", entityId: copy._id.toString(), after: { bookId, accessionNo: copy.accessionNo, status: copy.status } });
    res.status(201).json({ copy: copy.toObject() });
  } catch (error) { next(error); }
}

export async function updateCopy(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = IdParamSchema.parse(req.params);
    const data = UpdateLibraryCopySchema.parse(req.body);
    const schoolId = getTenantId(req);
    const copy = await LibraryCopy.findOne({ _id: id, schoolId });
    if (!copy) throw AppError.notFound("Library copy not found");
    if (data.status && data.status !== copy.status) {
      if (copy.status === LibraryCopyStatus.ISSUED) throw AppError.conflict("Issued copies can only change state through return or loss workflow");
      if (copy.status === LibraryCopyStatus.RETIRED) throw AppError.conflict("Retired copies cannot be reactivated");
      if (data.status === LibraryCopyStatus.AVAILABLE && copy.status !== LibraryCopyStatus.DAMAGED && copy.status !== LibraryCopyStatus.LOST) throw AppError.badRequest("Invalid copy status transition");
    }
    Object.assign(copy, data);
    await copy.save();
    await createAuditLog({ userId: req.user!.userId, action: "UPDATE", entity: "LibraryCopy", entityId: id, after: data });
    res.json({ copy: copy.toObject() });
  } catch (error) { next(error); }
}

export async function getLoans(req: Request, res: Response, next: NextFunction) {
  try {
    const query = LibraryLoanQuerySchema.parse(req.query);
    const schoolId = getTenantId(req);
    const dbQuery: Record<string, any> = { schoolId };
    if (query.borrowerType) dbQuery.borrowerType = query.borrowerType;
    if (query.borrowerId) dbQuery.borrowerId = query.borrowerId;
    if (query.copyId) dbQuery.copyId = query.copyId;
    const now = new Date();
    if (query.status === LibraryLoanStatus.RETURNED) dbQuery.status = LibraryLoanStatus.RETURNED;
    else if (query.status === LibraryLoanStatus.OVERDUE) Object.assign(dbQuery, { activeLoan: true, dueAt: { $lt: now } });
    else if (query.status === LibraryLoanStatus.ACTIVE) Object.assign(dbQuery, { activeLoan: true, dueAt: { $gte: now } });
    const skip = (query.page - 1) * query.limit;
    const [loans, total] = await Promise.all([LibraryLoan.find(dbQuery).populate({ path: "copyId", select: "accessionNo bookId" }).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(), LibraryLoan.countDocuments(dbQuery)]);
    res.json({ data: loans.map(loanView), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
  } catch (error) { next(error); }
}

export async function issueLoan(req: Request, res: Response, next: NextFunction) {
  try {
    const data = IssueLibraryLoanSchema.parse(req.body);
    const schoolId = getTenantId(req);
    const copy = await LibraryCopy.findOne({ _id: data.copyId, schoolId }).lean();
    if (!copy) throw AppError.notFound("Library copy not found");
    if (copy.status !== LibraryCopyStatus.AVAILABLE) throw AppError.conflict("Library copy is not available");
    if (!await LibraryBook.exists({ _id: copy.bookId, schoolId, status: LibraryBookStatus.ACTIVE })) throw AppError.conflict("Library book is inactive");
    if (data.borrowerType === LibraryBorrowerType.STUDENT) {
      if (!await Student.exists({ _id: data.borrowerId, schoolId, status: StudentStatus.ACTIVE })) throw AppError.notFound("Active student borrower not found");
    } else if (!await Staff.exists({ _id: data.borrowerId, schoolId, status: StaffStatus.ACTIVE })) {
      throw AppError.notFound("Active staff borrower not found");
    }

    const claimedCopy = await LibraryCopy.findOneAndUpdate({ _id: data.copyId, schoolId, status: LibraryCopyStatus.AVAILABLE }, { $set: { status: LibraryCopyStatus.ISSUED } }, { new: true }).lean();
    if (!claimedCopy) throw AppError.conflict("Library copy was issued by another request");
    try {
      const loan = await LibraryLoan.create({ schoolId, copyId: data.copyId, borrowerType: data.borrowerType, borrowerId: data.borrowerId, issuedAt: new Date(), dueAt: new Date(data.dueAt), dailyFineRate: data.dailyFineRate, fineAmount: 0, status: LibraryLoanStatus.ACTIVE, activeLoan: true, notes: data.notes, issuedBy: req.user!.userId });
      await createAuditLog({ userId: req.user!.userId, action: "ISSUE", entity: "LibraryLoan", entityId: loan._id.toString(), after: { copyId: data.copyId, borrowerType: data.borrowerType, borrowerId: data.borrowerId, dueAt: loan.dueAt, dailyFineRate: loan.dailyFineRate } });
      res.status(201).json({ loan: loan.toObject() });
    } catch (error: any) {
      await LibraryCopy.updateOne({ _id: data.copyId, schoolId, status: LibraryCopyStatus.ISSUED }, { $set: { status: LibraryCopyStatus.AVAILABLE } });
      if (error?.code === 11000) throw AppError.conflict("Library copy already has an active loan");
      throw error;
    }
  } catch (error) { next(error); }
}

export async function returnLoan(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = IdParamSchema.parse(req.params);
    const data = ReturnLibraryLoanSchema.parse(req.body);
    const schoolId = getTenantId(req);
    const existing = await LibraryLoan.findOne({ _id: id, schoolId, activeLoan: true, status: LibraryLoanStatus.ACTIVE }).lean();
    if (!existing) throw AppError.notFound("Active library loan not found");
    const returnedAt = data.returnedAt ? new Date(data.returnedAt) : new Date();
    if (returnedAt.getTime() > Date.now()) throw AppError.badRequest("Return time cannot be in the future");
    if (returnedAt.getTime() < new Date(existing.issuedAt).getTime()) throw AppError.badRequest("Return time cannot precede issue time");
    const fineAmount = calculateFine(new Date(existing.dueAt), returnedAt, existing.dailyFineRate);
    const loan = await LibraryLoan.findOneAndUpdate({ _id: id, schoolId, activeLoan: true, status: LibraryLoanStatus.ACTIVE }, { $set: { returnedAt, fineAmount, status: LibraryLoanStatus.RETURNED, activeLoan: false, returnedBy: req.user!.userId } }, { new: true });
    if (!loan) throw AppError.conflict("Library loan was already returned");
    const copy = await LibraryCopy.findOneAndUpdate({ _id: existing.copyId, schoolId, status: LibraryCopyStatus.ISSUED }, { $set: { status: LibraryCopyStatus.AVAILABLE } }, { new: true });
    if (!copy) {
      await LibraryLoan.updateOne({ _id: id, schoolId, activeLoan: false }, { $set: { status: LibraryLoanStatus.ACTIVE, activeLoan: true, fineAmount: 0 }, $unset: { returnedAt: 1, returnedBy: 1 } });
      throw AppError.conflict("Library copy state is inconsistent; return was rolled back");
    }
    await createAuditLog({ userId: req.user!.userId, action: "RETURN", entity: "LibraryLoan", entityId: id, after: { copyId: existing.copyId, returnedAt, fineAmount } });
    res.json({ loan: loan.toObject(), fineAmount });
  } catch (error) { next(error); }
}
