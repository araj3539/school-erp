import type { NotificationChannel } from "../models/NotificationPreference.js";
import type { NotificationPriority } from "../models/Notification.js";
import { Types } from "mongoose";

export interface NotificationDeliveryContext {
  schoolId: Types.ObjectId;
  eventId: Types.ObjectId;
  recipientId: Types.ObjectId;
  channel: NotificationChannel;
  priority: NotificationPriority;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
}

export interface NotificationProviderResult {
  accepted: boolean;
  providerMessageId?: string;
}

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(context: NotificationDeliveryContext): Promise<NotificationProviderResult>;
}

export class NotificationProviderNotConfiguredError extends Error {
  readonly retryable = false;

  constructor(channel: NotificationChannel) {
    super(`Notification provider is not configured for channel: ${channel}`);
    this.name = "NotificationProviderNotConfiguredError";
  }
}

/**
 * Safe default for channels that have no approved external provider yet.
 * It fails closed instead of silently dropping a requested notification.
 */
export class DisabledNotificationProvider implements NotificationProvider {
  constructor(public readonly channel: NotificationChannel) {}

  async send(_context: NotificationDeliveryContext): Promise<NotificationProviderResult> {
    throw new NotificationProviderNotConfiguredError(this.channel);
  }
}

/**
 * Provider registry is deliberately dependency-free. External adapters can be
 * added here only after a provider has been explicitly approved and its
 * credentials/configuration are supplied through server-side environment
 * configuration.
 */
export class NotificationProviderRegistry {
  private readonly providers = new Map<NotificationChannel, NotificationProvider>();

  register(provider: NotificationProvider): void {
    this.providers.set(provider.channel, provider);
  }

  get(channel: NotificationChannel): NotificationProvider {
    return this.providers.get(channel) ?? new DisabledNotificationProvider(channel);
  }
}
