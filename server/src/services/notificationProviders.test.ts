import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { DisabledNotificationProvider, NotificationProviderNotConfiguredError, NotificationProviderRegistry } from "./notificationProviders.js";
import type { NotificationDeliveryContext, NotificationProvider } from "./notificationProviders.js";

const context: NotificationDeliveryContext = {
  schoolId: new Types.ObjectId(),
  eventId: new Types.ObjectId(),
  recipientId: new Types.ObjectId(),
  channel: "email",
  priority: "normal",
  title: "Test",
  message: "Test notification",
};

describe("NotificationProviderRegistry", () => {
  it("returns a fail-closed disabled provider for unconfigured channels", async () => {
    const registry = new NotificationProviderRegistry();
    const provider = registry.get("email");
    expect(provider).toBeInstanceOf(DisabledNotificationProvider);
    await expect(provider.send(context)).rejects.toBeInstanceOf(NotificationProviderNotConfiguredError);
    await expect(provider.send(context)).rejects.toMatchObject({ retryable: false });
  });

  it("returns the explicitly registered provider", async () => {
    const registry = new NotificationProviderRegistry();
    const provider: NotificationProvider = {
      channel: "email",
      async send() {
        return { accepted: true, providerMessageId: "test-provider-id" };
      },
    };
    registry.register(provider);
    expect(registry.get("email")).toBe(provider);
    await expect(registry.get("email").send(context)).resolves.toEqual({ accepted: true, providerMessageId: "test-provider-id" });
  });

  it("keeps providers isolated by channel", () => {
    const registry = new NotificationProviderRegistry();
    const emailProvider: NotificationProvider = { channel: "email", async send() { return { accepted: true }; } };
    const smsProvider: NotificationProvider = { channel: "sms", async send() { return { accepted: true }; } };
    registry.register(emailProvider);
    registry.register(smsProvider);
    expect(registry.get("email")).toBe(emailProvider);
    expect(registry.get("sms")).toBe(smsProvider);
    expect(registry.get("push")).toBeInstanceOf(DisabledNotificationProvider);
  });
});
