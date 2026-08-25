import { z } from "zod";

const dateString = z.string().datetime({ offset: true });

export const AcademicYearCreateSchema = z.object({
  name: z.string().trim().min(1).max(20),
  startDate: dateString,
  endDate: dateString,
  isCurrent: z.boolean().optional().default(false),
});

export const AcademicYearUpdateSchema = z.object({
  name: z.string().trim().min(1).max(20).optional(),
  startDate: dateString.optional(),
  endDate: dateString.optional(),
});
