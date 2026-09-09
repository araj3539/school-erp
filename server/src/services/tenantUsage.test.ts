import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  limitFindOne: vi.fn(),
  usageExists: vi.fn(),
  usageUpdateOne: vi.fn(),
  usageFindOneAndUpdate: vi.fn(),
}));

vi.mock("../models/index.js", () => ({
  Student: { countDocuments: vi.fn(), aggregate: vi.fn() },
  User: { countDocuments: vi.fn() },
  TenantLimit: { findOne: mocks.limitFindOne },
  TenantUsage: { exists: mocks.usageExists, updateOne: mocks.usageUpdateOne, findOneAndUpdate: mocks.usageFindOneAndUpdate, findOne: vi.fn() },
}));

import { incrementTenantUsage } from "./tenantUsage.js";

describe("tenant usage metering", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses an atomic conditional increment against the configured limit", async () => {
    mocks.limitFindOne.mockReturnValue({ select: () => ({ lean: async () => ({ limit: 5 }) }) });
    mocks.usageExists.mockResolvedValue(true);
    mocks.usageUpdateOne.mockResolvedValue({ acknowledged: true });
    mocks.usageFindOneAndUpdate.mockReturnValue({ lean: async () => ({ counters: { students: 5 } }) });

    await incrementTenantUsage("507f1f77bcf86cd799439011", "students", 1);

    expect(mocks.usageFindOneAndUpdate).toHaveBeenCalledWith(
      { schoolId: expect.anything(), "counters.students": { $lte: 4 } },
      { $inc: { "counters.students": 1 } },
      { new: true },
    );
  });

  it("rejects a concurrent increment when the conditional update no longer matches", async () => {
    mocks.limitFindOne.mockReturnValue({ select: () => ({ lean: async () => ({ limit: 5 }) }) });
    mocks.usageExists.mockResolvedValue(true);
    mocks.usageUpdateOne.mockResolvedValue({ acknowledged: true });
    mocks.usageFindOneAndUpdate.mockReturnValue({ lean: async () => null });

    await expect(incrementTenantUsage("507f1f77bcf86cd799439011", "students", 1)).rejects.toMatchObject({ statusCode: 409 });
  });

  it("prevents usage counters from going negative on release", async () => {
    mocks.limitFindOne.mockReturnValue({ select: () => ({ lean: async () => null }) });
    mocks.usageExists.mockResolvedValue(true);
    mocks.usageUpdateOne.mockResolvedValue({ acknowledged: true });
    mocks.usageFindOneAndUpdate.mockReturnValue({ lean: async () => ({ counters: { students: 0 } }) });

    await incrementTenantUsage("507f1f77bcf86cd799439011", "students", -1);

    expect(mocks.usageFindOneAndUpdate).toHaveBeenCalledWith(
      { schoolId: expect.anything(), "counters.students": { $gte: 1 } },
      { $inc: { "counters.students": -1 } },
      { new: true },
    );
  });
});
