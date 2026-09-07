import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { getBooks, getBookById, createBook, updateBook, deactivateBook, getCopies, createCopy, updateCopy, getLoans, issueLoan, returnLoan } from "../controllers/libraryController.js";
import { CreateLibraryBookSchema, UpdateLibraryBookSchema, LibraryBookQuerySchema, CreateLibraryCopySchema, UpdateLibraryCopySchema, LibraryCopyQuerySchema, IssueLibraryLoanSchema, ReturnLibraryLoanSchema, LibraryLoanQuerySchema, IdParamSchema } from "../validators/index.js";

const router = Router();
router.use(authenticate);
router.get("/books", requirePermission("library:read"), validate(LibraryBookQuerySchema, "query"), getBooks);
router.get("/books/:id", requirePermission("library:read"), validate(IdParamSchema, "params"), getBookById);
router.post("/books", requirePermission("library:write"), validate(CreateLibraryBookSchema), createBook);
router.put("/books/:id", requirePermission("library:write"), validate(IdParamSchema, "params"), validate(UpdateLibraryBookSchema), updateBook);
router.delete("/books/:id", requirePermission("library:delete"), validate(IdParamSchema, "params"), deactivateBook);
router.get("/copies", requirePermission("library:read"), validate(LibraryCopyQuerySchema, "query"), getCopies);
router.post("/books/:id/copies", requirePermission("library:write"), validate(IdParamSchema, "params"), validate(CreateLibraryCopySchema), createCopy);
router.put("/copies/:id", requirePermission("library:write"), validate(IdParamSchema, "params"), validate(UpdateLibraryCopySchema), updateCopy);
router.get("/loans", requirePermission("library:read"), validate(LibraryLoanQuerySchema, "query"), getLoans);
router.post("/loans", requirePermission("library:circulate"), validate(IssueLibraryLoanSchema), issueLoan);
router.post("/loans/:id/return", requirePermission("library:circulate"), validate(IdParamSchema, "params"), validate(ReturnLibraryLoanSchema), returnLoan);
export default router;
