import { test } from "node:test";
import assert from "node:assert/strict";
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

test("registry returns a fail-closed disabled provider for unconfigured channels", async () => {
  const registry = new NotificationProviderRegistry();
  const provider = registry.get("email");
  assert.ok(provider instanceof DisabledNotificationProvider);
  await assert.rejects(provider.send(context), (error: unknown) => {
    assert.ok(error instanceof NotificationProviderNotConfiguredError);
    assert.equal(error.retryable, false);
    assert.match(error.message, /email/);
    return true;
  });
});

test("registry returns the explicitly registered provider", async () => {
  const registry = new NotificationProviderRegistry();
  const provider: NotificationProvider = {
    channel: "email",
    async send() {
      return { accepted: true, providerMessageId: "test-provider-id" };
    },
  };
  registry.register(provider);
  assert.equal(registry.get("email"), provider);
  assert.deepEqual(await registry.get("email").send(context), { accepted: true, providerMessageId: "test-provider-id" });
});

test("registry keeps providers isolated by channel", () => {
  const registry = new NotificationProviderRegistry();
  const emailProvider: NotificationProvider = { channel: "email", async send() { return { accepted: true }; } };
  const smsProvider: NotificationProvider = { channel: "sms", async send() { return { accepted: true }; } };
  registry.register(emailProvider);
  registry.register(smsProvider);
  assert.equal(registry.get("email"), emailProvider);
  assert.equal(registry.get("sms"), smsProvider);
  assert.ok(registry.get("push") instanceof DisabledNotificationProvider);
});
