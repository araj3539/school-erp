import { describe, expect, it } from "vitest";
import { NotificationPreferenceSchema, NotificationQuerySchema } from "./phase9.js";

describe("phase 9 notification schemas", () => {
  it("accepts paginated notification queries", () => {
    const result = NotificationQuerySchema.safeParse({ page: "2", limit: "20", unreadOnly: "true", category: "attendance" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.unreadOnly).toBe(true);
  });

  it("rejects invalid notification categories", () => {
    expect(NotificationQuerySchema.safeParse({ category: "random" }).success).toBe(false);
  });

  it("accepts in-app preferences with quiet hours", () => {
    expect(NotificationPreferenceSchema.safeParse({ category: "announcement", channels: ["in_app"], quietHours: { start: "22:00", end: "07:00" } }).success).toBe(true);
  });

  it("rejects malformed quiet hours", () => {
    expect(NotificationPreferenceSchema.safeParse({ category: "announcement", channels: ["in_app"], quietHours: { start: "25:00", end: "07:00" } }).success).toBe(false);
  });
});
