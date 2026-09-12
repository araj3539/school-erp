import { z } from "zod";
export const NotificationTemplateSchema = z.object({ name: z.string().trim().min(2).max(100), category: z.enum(["announcement", "attendance", "homework", "result", "fee", "system"]), subject: z.string().trim().max(200).optional(), body: z.string().trim().min(1).max(5000), channels: z.array(z.enum(["in_app", "email", "sms", "push"])).min(1).max(4).default(["in_app"]) });
