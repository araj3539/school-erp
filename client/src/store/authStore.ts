import { create } from "zustand";
import { ROLE_PERMISSIONS, type User, type UserRole } from "@school-erp/shared";

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  initializeAuth: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  hasHydrated: false,

  login: (user) => {
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: Boolean(user) });
  },

  initializeAuth: async () => {
    try {
      const { default: api } = await import("../lib/api");
      const response = await api.get("/auth/me");
      set({ user: response.data.user, isAuthenticated: true, hasHydrated: true });
    } catch {
      set({ user: null, isAuthenticated: false, hasHydrated: true });
    }
  },

  setHasHydrated: (value) => set({ hasHydrated: value }),

  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role as UserRole] || [];
    return permissions.includes("*") || permissions.includes(permission);
  },

  hasAnyPermission: (permissions) => {
    const { user } = get();
    if (!user) return false;
    const userPermissions = ROLE_PERMISSIONS[user.role as UserRole] || [];
    if (userPermissions.includes("*")) return true;
    return permissions.some((permission) => userPermissions.includes(permission));
  },
}));
