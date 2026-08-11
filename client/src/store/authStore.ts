import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@school-erp/shared";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateAccessToken: (accessToken: string) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}const ROLE_PERMISSIONS: Record<UserRole, string[]> = {  super_admin: ["*"],  principal: [    "students:read", "students:write", "students:delete",    "teachers:read", "teachers:write", "teachers:delete",    "classes:read", "classes:write", "classes:delete",    "attendance:read", "attendance:write",    "fees:read", "fees:write", "fees:delete",    "reports:read", "reports:export",    "settings:read", "settings:write",    "users:read", "users:write"  ],  accountant: [    "fees:read", "fees:write",    "payments:read", "payments:write",    "expenses:read", "expenses:write",    "salary:read", "salary:write",    "reports:read", "reports:export"  ],  teacher: [    "attendance:read", "attendance:write",    "homework:read", "homework:write",    "marks:read", "marks:write",    "students:read",    "notices:read"  ],  student: [    "attendance:read:own",    "homework:read:own",    "marks:read:own",    "fees:read:own",    "notices:read"  ],  parent: [    "attendance:read:child",    "homework:read:child",    "marks:read:child",    "fees:read:child",    "notices:read"  ]};export const useAuthStore = create<AuthState>()(  persist(    (set, get) => ({      user: null,      isAuthenticated: false,      login: (user) => set({ user, isAuthenticated: true }),      logout: () => set({ user: null, isAuthenticated: false }),
      updateAccessToken: (accessToken: string) =>
        set((state) => ({
          user: state.user ? { ...state.user, accessToken } : null
        })),
      hasPermission: (permission) => {        const { user } = get();        if (!user) return false;        const permissions = ROLE_PERMISSIONS[user.role] || [];        return permissions.includes("*") || permissions.includes(permission);      },      hasAnyPermission: (permissions) => {        const { user } = get();        if (!user) return false;        const userPermissions = ROLE_PERMISSIONS[user.role] || [];        if (userPermissions.includes("*")) return true;        return permissions.some((p) => userPermissions.includes(p));      }    }),    {      name: "auth-storage",      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })    }  ));

