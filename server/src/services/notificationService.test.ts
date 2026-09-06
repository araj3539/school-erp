import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

const { eventFindOneAndUpdate, eventUpdateOne, deliveryInsertMany, deliveryUpdateMany, userFind, preferenceFind, notificationBulkWrite } = vi.hoisted(() => ({
  eventFindOneAndUpdate: vi.fn(), eventUpdateOne: vi.fn(), deliveryInsertMany: vi.fn(), deliveryUpdateMany: vi.fn(),
  userFind: vi.fn(), preferenceFind: vi.fn(), notificationBulkWrite: vi.fn(),
}));

vi.mock("../models/index.js", () => ({
  Notification: { bulkWrite: notificationBulkWrite },
  NotificationDeliveryAttempt: { insertMany: deliveryInsertMany, updateMany: deliveryUpdateMany },
  NotificationEvent: { findOneAndUpdate: eventFindOneAndUpdate, updateOne: eventUpdateOne },
  NotificationPreference: { find: preferenceFind }, User: { find: userFind }, Student: { find: vi.fn() }, Teacher: { find: vi.fn() },
}));

import { enqueueNotificationEvent, processOneNotificationEvent } from "./notificationService.js";

const schoolId = new Types.ObjectId();
const recipientId = new Types.ObjectId();
const eventId = new Types.ObjectId();

function queryResult<T>(value: T) { return { select: () => ({ lean: async () => value }), lean: async () => value }; }
function leanResult<T>(value: T) { return { lean: async () => value }; }
function makeEvent(attempts = 1) { return { _id: eventId, schoolId, eventType: "notice.published", category: "announcement", priority: "normal", recipientIds: [recipientId], title: "Notice", message: "School notice", idempotencyKey: "notice:event-1:2026-09-06T10:00:00.000Z", payload: {}, status: "processing", attempts, nextAttemptAt: new Date() }; }

describe("notification delivery attempts", () => {
  beforeEach(() => {
    vi.clearAllMocks(); eventFindOneAndUpdate.mockReturnValue(leanResult(null)); eventUpdateOne.mockResolvedValue({ acknowledged: true });
    deliveryInsertMany.mockResolvedValue([]); deliveryUpdateMany.mockResolvedValue({ acknowledged: true });
    userFind.mockReturnValue(queryResult([{ _id: recipientId }])); preferenceFind.mockReturnValue(leanResult([])); notificationBulkWrite.mockResolvedValue({ acknowledged: true });
  });

  it("creates tenant-scoped durable events with deterministic idempotency", async () => {
    eventFindOneAndUpdate.mockReturnValue(leanResult(makeEvent()));
    await enqueueNotificationEvent({ schoolId, eventType: "notice.published", category: "announcement", recipientIds: [recipientId], title: "Notice", message: "School notice", idempotencyKey: "notice:event-1:2026-09-06T10:00:00.000Z" });
    expect(eventFindOneAndUpdate).toHaveBeenCalledWith({ schoolId, idempotencyKey: "notice:event-1:2026-09-06T10:00:00.000Z" }, expect.objectContaining({ $setOnInsert: expect.objectContaining({ schoolId, recipientIds: [recipientId] }) }), expect.objectContaining({ upsert: true }));
  });

  it("records a processing attempt and marks it succeeded after in-app delivery", async () => {
    eventFindOneAndUpdate.mockReturnValue(leanResult(makeEvent(1)));
    expect(await processOneNotificationEvent()).toBe(true);
    expect(deliveryInsertMany).toHaveBeenCalledWith([expect.objectContaining({ schoolId, eventId, recipientId, channel: "in_app", attempt: 1, status: "processing" })], { ordered: false });
    expect(notificationBulkWrite).toHaveBeenCalledTimes(1);
    expect(deliveryUpdateMany).toHaveBeenCalledWith({ eventId, attempt: 1, status: "processing" }, expect.objectContaining({ $set: expect.objectContaining({ status: "succeeded" }) }));
    expect(eventUpdateOne).toHaveBeenLastCalledWith({ _id: eventId }, expect.objectContaining({ $set: expect.objectContaining({ status: "completed" }) }));
  });

  it("records retry state and preserves tenant-scoped event failure details", async () => {
    eventFindOneAndUpdate.mockReturnValue(leanResult(makeEvent(2))); notificationBulkWrite.mockRejectedValueOnce(new Error("provider unavailable"));
    expect(await processOneNotificationEvent()).toBe(true);
    expect(deliveryUpdateMany).toHaveBeenCalledWith({ eventId, attempt: 2, status: "processing" }, expect.objectContaining({ $set: expect.objectContaining({ status: "retrying", error: "provider unavailable" }) }));
    expect(eventUpdateOne).toHaveBeenLastCalledWith({ _id: eventId }, expect.objectContaining({ $set: expect.objectContaining({ status: "pending", lastError: "provider unavailable" }) }));
  });

  it("records dead-letter state after the maximum delivery attempt", async () => {
    eventFindOneAndUpdate.mockReturnValue(leanResult(makeEvent(5))); notificationBulkWrite.mockRejectedValueOnce(new Error("permanent failure"));
    expect(await processOneNotificationEvent()).toBe(true);
    expect(deliveryUpdateMany).toHaveBeenCalledWith({ eventId, attempt: 5, status: "processing" }, expect.objectContaining({ $set: expect.objectContaining({ status: "dead_letter", error: "permanent failure" }) }));
    expect(eventUpdateOne).toHaveBeenLastCalledWith({ _id: eventId }, expect.objectContaining({ $set: expect.objectContaining({ status: "failed", lastError: "permanent failure" }) }));
  });

  it("never delivers to inactive or cross-tenant recipients", async () => {
    eventFindOneAndUpdate.mockReturnValue(leanResult(makeEvent(1))); userFind.mockReturnValue(queryResult([]));
    expect(await processOneNotificationEvent()).toBe(true); expect(notificationBulkWrite).not.toHaveBeenCalled(); expect(deliveryInsertMany).not.toHaveBeenCalled();
    expect(eventUpdateOne).toHaveBeenLastCalledWith({ _id: eventId }, expect.objectContaining({ $set: expect.objectContaining({ status: "completed" }) }));
  });
});
