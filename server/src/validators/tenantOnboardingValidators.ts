import { z } from "zod";

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const date = z.string().datetime({ offset: true });

export const TenantOnboardingSchema = z.object({
  idempotencyKey: z.string().trim().min(16).max(128).regex(/^[A-Za-z0-9._:-]+$/),
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().min(5).max(500),
  phone: z.string().trim().min(7).max(20),
  email,
  session: z.string().trim().min(4).max(20),
  academicYear: z.object({
    name: z.string().trim().min(4).max(20),
    startDate: date,
    endDate: date,
  }),
  admin: z.object({
    email,
    password: z.string().min(12).max(128),
  }),
}).superRefine((value, ctx) => {
  if (new Date(value.academicYear.endDate) <= new Date(value.academicYear.startDate)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["academicYear", "endDate"], message: "Academic year endDate must be after startDate" });
  }
});

export type TenantOnboardingInput = z.infer<typeof TenantOnboardingSchema>;
