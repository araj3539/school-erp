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

function resolveActiveSchoolId(user: User, schools: TenantSchool[], requested?: string | null) {
  if (user.schoolId) return String(user.schoolId);
  if (requested && schools.some((school) => school.id === requested)) return requested;
  return schools[0]?.id ?? null;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  hasHydrated: false,
  activeSchoolId: null,
  availableSchools: [],

  login: (user, tenant) => {
    const schools = tenant?.schools || [];
    const activeSchoolId = resolveActiveSchoolId(user, schools, tenant?.activeSchoolId);
    set({ user, isAuthenticated: true, hasHydrated: true, activeSchoolId, availableSchools: schools });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, hasHydrated: true, activeSchoolId: null, availableSchools: [] });
  },

  setUser: (user) => {
    const { availableSchools, activeSchoolId } = get();
    set({
      user,
      isAuthenticated: Boolean(user),
      hasHydrated: true,
      activeSchoolId: user ? resolveActiveSchoolId(user, availableSchools, activeSchoolId) : null,
    });
  },

  setActiveSchoolId: (schoolId) => {
    const { user, availableSchools } = get();
    if (!user || user.role !== "super_admin") return;
    if (!schoolId || availableSchools.some((school) => school.id === schoolId)) set({ activeSchoolId: schoolId });
  },

  initializeAuth: async () => {
    try {
      const { default: api } = await import("../lib/api");
      const response = await api.get("/auth/me");
      const user = response.data.user as User;
      const schools = (response.data.schools || []) as TenantSchool[];
      const activeSchoolId = resolveActiveSchoolId(user, schools);
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