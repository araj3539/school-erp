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
