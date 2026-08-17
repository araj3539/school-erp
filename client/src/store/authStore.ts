import { create } from "zustand";
import type { User, UserRole } from "@school-erp/shared";

const STORAGE_KEY = "auth-storage";

type PersistedAuth = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
};

function readPersistedAuth(): PersistedAuth {
  const empty: PersistedAuth = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
  };

  if (typeof window === "undefined") return empty;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;

    const parsed = JSON.parse(raw);
    const state = parsed?.state ?? parsed;

    if (!state?.user || !state?.accessToken || state.isAuthenticated !== true) {
      return empty;
    }

    return {
      user: state.user,
      accessToken: state.accessToken,
      isAuthenticated: true,
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return empty;
  }
}

function persistAuth(state: PersistedAuth): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ state, version: 0 }),
  );
}

interface AuthState extends PersistedAuth {
  hasHydrated: boolean;
  login: (user: User, accessToken?: string) => void;
  logout: () => void;
  updateAccessToken: (accessToken: string) => void;
  setHasHydrated: (value: boolean) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ["*"],
  principal: ["students:read", "students:write", "students:delete", "teachers:read", "teachers:write", "teachers:delete", "classes:read", "classes:write", "classes:delete", "attendance:read", "attendance:write", "fees:read", "fees:write", "fees:delete", "reports:read", "reports:export", "settings:read", "settings:write", "users:read", "users:write"],
  accountant: ["fees:read", "fees:write", "payments:read", "payments:write", "expenses:read", "expenses:write", "salary:read", "salary:write", "reports:read", "reports:export"],
  teacher: ["attendance:read", "attendance:write", "homework:read", "homework:write", "marks:read", "marks:write", "students:read", "notices:read"],
  student: ["attendance:read:own", "homework:read:own", "marks:read:own", "fees:read:own", "notices:read"],
  parent: ["attendance:read:child", "homework:read:child", "marks:read:child", "fees:read:child", "notices:read"],
};

const initialAuth = readPersistedAuth();

export const useAuthStore = create<AuthState>()((set, get) => ({
  ...initialAuth,
  hasHydrated: true,

  login: (user, accessToken) => {
    const next = {
      user,
      accessToken: accessToken ?? null,
      isAuthenticated: Boolean(accessToken),
    };

    set(next);
    persistAuth(next);
  },

  logout: () => {
    const next = {
      user: null,
      accessToken: null,
      isAuthenticated: false,
    };

    set(next);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  },

  updateAccessToken: (accessToken) => {
    const current = get();
    const next = {
      user: current.user,
      accessToken,
      isAuthenticated: Boolean(current.user && accessToken),
    };

    set(next);
    persistAuth(next);
  },

  setHasHydrated: (value) => set({ hasHydrated: value }),

  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes("*") || permissions.includes(permission);
  },

  hasAnyPermission: (permissions) => {
    const { user } = get();
    if (!user) return false;
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    if (userPermissions.includes("*")) return true;
    return permissions.some((permission) => userPermissions.includes(permission));
  },
}));
