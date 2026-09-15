import { z } from "zod";
import { ObjectIdSchema, DateOnlySchema } from "@school-erp/shared";

export const CreateTeacherAbsenceSchema = z.object({
  teacherId: ObjectIdSchema,
  date: DateOnlySchema,
  reason: z.string().trim().max(500).optional(),
});

export const TeacherAbsenceQuerySchema = z.object({
  date: DateOnlySchema.optional(),
  startDate: DateOnlySchema.optional(),
  endDate: DateOnlySchema.optional(),
  teacherId: ObjectIdSchema.optional(),
  status: z.enum(["reported", "partially_assigned", "assigned", "cancelled"]).optional(),
});

export const SubstituteAssignmentSchema = z.object({
  timetableId: ObjectIdSchema,
  substituteTeacherId: ObjectIdSchema,
});
