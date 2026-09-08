import { describe, expect, it } from "vitest";
import { assertTenantTransition, nextTenantTimestamps } from "./tenantLifecycle.js";

describe("tenant lifecycle", () => {
  it("allows active suspension and suspension recovery", () => {
    expect(() => assertTenantTransition("active", "suspended")).not.toThrow();
    expect(() => assertTenantTransition("suspended", "active")).not.toThrow();
  });

  it("allows archival but never reactivates an archived tenant", () => {
    expect(() => assertTenantTransition("active", "archived")).not.toThrow();
    expect(() => assertTenantTransition("suspended", "archived")).not.toThrow();
    expect(() => assertTenantTransition("archived", "active")).toThrow(/cannot transition/);
  });

  it("is idempotent for the current state", () => {
    expect(() => assertTenantTransition("active", "active")).not.toThrow();
    expect(() => assertTenantTransition("suspended", "suspended")).not.toThrow();
  });

  it("records lifecycle timestamps by target state", () => {
    const now = new Date("2026-09-09T00:00:00.000Z");
    expect(nextTenantTimestamps("suspended", now)).toEqual({ suspendedAt: now, archivedAt: undefined });
    expect(nextTenantTimestamps("archived", now)).toEqual({ archivedAt: now });
    expect(nextTenantTimestamps("active", now)).toEqual({ suspendedAt: undefined, archivedAt: undefined });
  });
});
