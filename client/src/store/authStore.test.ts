import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@school-erp/shared";

const apiGet = vi.fn();

vi.mock("../lib/api", () => ({
  default: { get: apiGet },
}));

import { useAuthStore } from "./authStore";

const user = {
  id: "user-1",
  email: "principal@example.com",
  role: "principal",
  schoolId: "school-1",
  isActive: true,
} as User;

describe("auth initialization", () => {
  beforeEach(() => {
    apiGet.mockReset();
    useAuthStore.getState().logout();
  });

  it("does not log out a user when a stale initial auth check rejects after login", async () => {
    let rejectRequest!: (error: Error) => void;
    apiGet.mockReturnValueOnce(new Promise((_resolve, reject) => { rejectRequest = reject; }));

    const initialization = useAuthStore.getState().initializeAuth();
    useAuthStore.getState().login(user);
    await Promise.resolve();
    rejectRequest(new Error("initial /auth/me request failed"));
    await initialization;

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe(user.email);
  });

  it("does not overwrite a newer login when a stale initial auth check resolves", async () => {
    let resolveRequest!: (value: unknown) => void;
    apiGet.mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve; }));

    const initialization = useAuthStore.getState().initializeAuth();
    useAuthStore.getState().login(user);
    await Promise.resolve();
    resolveRequest({ data: { user: { ...user, email: "stale@example.com" } } });
    await initialization;

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe(user.email);
  });
});
