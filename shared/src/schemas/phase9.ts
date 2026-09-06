import { z } from "zod";
import { ObjectIdSchema, PaginationSchema } from "./index.js";

export const NotificationCategorySchema = z.enum([
  "announcement",
  "attendance",
  "homework",
  "result",
  "fee",
  "system",
]);
export const NotificationPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);
export const NotificationChannelSchema = z.enum(["in_app", "email", "sms", "push"]);

export const NotificationQuerySchema = PaginationSchema.extend({
  unreadOnly: z.coerce.boolean().default(false),
  category: NotificationCategorySchema.optional(),
});

export const NotificationIdParamSchema = z.object({ id: ObjectIdSchema });
export const NotificationPreferenceSchema = z.object({
  category: NotificationCategorySchema,
  channels: z.array(NotificationChannelSchema).min(1).max(4),
  quietHours: z.object({
    start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  }).optional(),
}).strict();
export const NotificationPreferenceListSchema = z.object({
  preferences: z.array(NotificationPreferenceSchema),
});

export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;
export type NotificationPreferenceInput = z.infer<typeof NotificationPreferenceSchema>;
