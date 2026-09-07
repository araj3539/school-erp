import { z } from "zod";
import { ObjectIdSchema } from "./index.js";

export const StaffStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ON_LEAVE: "on_leave"
} as const;

export const StaffEmploymentType = {
  FULL_TIME: "full_time",
  PART_TIME: "part_time",
  CONTRACT: "contract"
} as const;

export const StaffSchema = z.object({
  _id: ObjectIdSchema.optional(),
  schoolId: ObjectIdSchema.optional(),
  employeeId: z.string().trim().min(1).max(20),
  userId: ObjectIdSchema.optional(),
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().min(7).max(20),
  department: z.string().trim().min(1).max(80),
  designation: z.string().trim().min(1).max(100),
  employmentType: z.enum([StaffEmploymentType.FULL_TIME, StaffEmploymentType.PART_TIME, StaffEmploymentType.CONTRACT]),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Joining date must be YYYY-MM-DD"),
  salary: z.number().finite().nonnegative(),
  status: z.enum([StaffStatus.ACTIVE, StaffStatus.INACTIVE, StaffStatus.ON_LEAVE]).default(StaffStatus.ACTIVE),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export const CreateStaffSchema = StaffSchema.omit({ _id: true, schoolId: true, createdAt: true, updatedAt: true }).extend({
  employeeId: StaffSchema.shape.employeeId.optional(),
  userId: ObjectIdSchema.optional(),
  salary: z.number().finite().nonnegative().default(0)
});

export const UpdateStaffSchema = CreateStaffSchema.partial();

export const StaffQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum([StaffStatus.ACTIVE, StaffStatus.INACTIVE, StaffStatus.ON_LEAVE]).optional(),
  department: z.string().trim().max(80).optional(),
  search: z.string().trim().max(100).optional()
});

export const LibraryBookStatus = { ACTIVE: "active", INACTIVE: "inactive" } as const;
export const LibraryCopyStatus = { AVAILABLE: "available", ISSUED: "issued", LOST: "lost", DAMAGED: "damaged", RETIRED: "retired" } as const;
export const LibraryLoanStatus = { ACTIVE: "active", RETURNED: "returned", OVERDUE: "overdue" } as const;
export const LibraryBorrowerType = { STUDENT: "student", STAFF: "staff" } as const;

export const LibraryBookSchema = z.object({
  _id: ObjectIdSchema.optional(), schoolId: ObjectIdSchema.optional(),
  title: z.string().trim().min(1).max(200), author: z.string().trim().min(1).max(150),
  isbn: z.string().trim().max(20).optional(), category: z.string().trim().max(80).optional(),
  publisher: z.string().trim().max(150).optional(), edition: z.string().trim().max(50).optional(),
  publicationYear: z.number().int().min(1000).max(2100).optional(), language: z.string().trim().max(50).optional(),
  shelfLocation: z.string().trim().max(80).optional(), description: z.string().trim().max(2000).optional(),
  status: z.enum([LibraryBookStatus.ACTIVE, LibraryBookStatus.INACTIVE]).default(LibraryBookStatus.ACTIVE),
  createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional()
});
export const CreateLibraryBookSchema = LibraryBookSchema.omit({ _id: true, schoolId: true, createdAt: true, updatedAt: true });
export const UpdateLibraryBookSchema = CreateLibraryBookSchema.partial();
export const LibraryBookQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), status: z.enum([LibraryBookStatus.ACTIVE, LibraryBookStatus.INACTIVE]).optional(), category: z.string().trim().max(80).optional(), search: z.string().trim().max(100).optional() });

export const LibraryCopySchema = z.object({
  _id: ObjectIdSchema.optional(), schoolId: ObjectIdSchema.optional(), bookId: ObjectIdSchema,
  accessionNo: z.string().trim().min(1).max(30), status: z.enum([LibraryCopyStatus.AVAILABLE, LibraryCopyStatus.ISSUED, LibraryCopyStatus.LOST, LibraryCopyStatus.DAMAGED, LibraryCopyStatus.RETIRED]).default(LibraryCopyStatus.AVAILABLE),
  conditionNote: z.string().trim().max(500).optional(), createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional()
});
export const CreateLibraryCopySchema = LibraryCopySchema.omit({ _id: true, schoolId: true, createdAt: true, updatedAt: true, status: true }).extend({ status: z.enum([LibraryCopyStatus.AVAILABLE, LibraryCopyStatus.DAMAGED]).default(LibraryCopyStatus.AVAILABLE) });
export const UpdateLibraryCopySchema = z.object({ conditionNote: z.string().trim().max(500).optional(), status: z.enum([LibraryCopyStatus.AVAILABLE, LibraryCopyStatus.LOST, LibraryCopyStatus.DAMAGED, LibraryCopyStatus.RETIRED]).optional() });
export const LibraryCopyQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), bookId: ObjectIdSchema.optional(), status: z.enum([LibraryCopyStatus.AVAILABLE, LibraryCopyStatus.ISSUED, LibraryCopyStatus.LOST, LibraryCopyStatus.DAMAGED, LibraryCopyStatus.RETIRED]).optional(), search: z.string().trim().max(100).optional() });

export const IssueLibraryLoanSchema = z.object({ copyId: ObjectIdSchema, borrowerType: z.enum([LibraryBorrowerType.STUDENT, LibraryBorrowerType.STAFF]), borrowerId: ObjectIdSchema, dueAt: z.string().datetime(), dailyFineRate: z.number().finite().nonnegative().max(100000).default(0), notes: z.string().trim().max(500).optional() }).refine((value) => new Date(value.dueAt).getTime() > Date.now(), { path: ["dueAt"], message: "Due date must be in the future" });
export const ReturnLibraryLoanSchema = z.object({ returnedAt: z.string().datetime().optional() });
export const LibraryLoanQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), status: z.enum([LibraryLoanStatus.ACTIVE, LibraryLoanStatus.RETURNED, LibraryLoanStatus.OVERDUE]).optional(), borrowerType: z.enum([LibraryBorrowerType.STUDENT, LibraryBorrowerType.STAFF]).optional(), borrowerId: ObjectIdSchema.optional(), copyId: ObjectIdSchema.optional() });
