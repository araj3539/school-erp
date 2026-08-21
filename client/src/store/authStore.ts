import { create } from "zustand";
import { ROLE_PERMISSIONS, type User, type UserRole } from "@school-erp/shared";

type TenantSchool = { id: string; name: string; code: string };

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  activeSchoolId: string | null;
  availableSchools: TenantSchool[];
  login: (user: User, tenant?: { activeSchoolId?: string | null; schools?: TenantSchool[] }) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setActiveSchoolId: (schoolId: string | null) => void;
  initializeAuth: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  hasHydrated: false,
  activeSchoolId: null,
  availableSchools: [],

  login: (user, tenant) => {
    const schools = tenant?.schools || [];
    const activeSchoolId = user.schoolId ? String(user.schoolId) : (tenant?.activeSchoolId || (schools.length === 1 ? schools[0].id : null));
    set({ user, isAuthenticated: true, hasHydrated: true, activeSchoolId, availableSchools: schools });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, hasHydrated: true, activeSchoolId: null, availableSchools: [] });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: Boolean(user), hasHydrated: true, activeSchoolId: user?.schoolId ? String(user.schoolId) : get().activeSchoolId });
  },

  setActiveSchoolId: (schoolId) => set({ activeSchoolId: schoolId }),

  initializeAuth: async () => {
    try {
      const { default: api } = await import("../lib/api");
      const response = await api.get("/auth/me");
      const user = response.data.user as User;
      const schools = (response.data.schools || []) as TenantSchool[];
      const activeSchoolId = user.schoolId ? String(user.schoolId) : (schools.length === 1 ? schools[0].id : null);
      set({ user, isAuthenticated: true, hasHydrated: true, activeSchoolId, availableSchools: schools });
    } catch {
      set({ user: null, isAuthenticated: false, hasHydrated: true, activeSchoolId: null, availableSchools: [] });
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
