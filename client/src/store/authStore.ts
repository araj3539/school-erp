import { create } from "zustand";
import { ROLE_PERMISSIONS, type User, type UserRole } from "@school-erp/shared";

type TenantSchool = { id: string; name: string; code: string };

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  sessionVersion: number;
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

let authInitializationPromise: Promise<void> | null = null;

function resolveActiveSchoolId(user: User, schools: TenantSchool[], requested?: string | null) {
  if (user.schoolId) return String(user.schoolId);
  if (requested && schools.some((school) => school.id === requested)) return requested;
  return schools[0]?.id ?? null;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  hasHydrated: false,
  sessionVersion: 0,
  activeSchoolId: null,
  availableSchools: [],

  login: (user, tenant) => {
    const schools = tenant?.schools || [];
    const activeSchoolId = resolveActiveSchoolId(user, schools, tenant?.activeSchoolId);
    set((state) => ({ user, isAuthenticated: true, hasHydrated: true, sessionVersion: state.sessionVersion + 1, activeSchoolId, availableSchools: schools }));
  },

  logout: () => {
    set((state) => ({ user: null, isAuthenticated: false, hasHydrated: true, sessionVersion: state.sessionVersion + 1, activeSchoolId: null, availableSchools: [] }));
  },

  setUser: (user) => {
    const { availableSchools, activeSchoolId } = get();
    set((state) => ({
      user,
      isAuthenticated: Boolean(user),
      hasHydrated: true,
      sessionVersion: user ? state.sessionVersion + 1 : state.sessionVersion,
      activeSchoolId: user ? resolveActiveSchoolId(user, availableSchools, activeSchoolId) : null,
    }));
  },

  setActiveSchoolId: (schoolId) => {
    const { user, availableSchools } = get();
    if (!user || user.role !== "super_admin") return;
    if (!schoolId || availableSchools.some((school) => school.id === schoolId)) set({ activeSchoolId: schoolId });
  },

  initializeAuth: async () => {
    if (get().isAuthenticated) return;
    if (authInitializationPromise) return authInitializationPromise;

    const startVersion = get().sessionVersion;
    authInitializationPromise = (async () => {
      try {
        const { default: api } = await import("../lib/api");
        const response = await api.get("/auth/me");
        if (get().sessionVersion !== startVersion || get().isAuthenticated) return;
        const user = response.data.user as User;
        const schools = (response.data.schools || []) as TenantSchool[];
        const activeSchoolId = resolveActiveSchoolId(user, schools);
        set({ user, isAuthenticated: true, hasHydrated: true, activeSchoolId, availableSchools: schools });
      } catch {
        if (get().sessionVersion !== startVersion || get().isAuthenticated) return;
        set({ user: null, isAuthenticated: false, hasHydrated: true, activeSchoolId: null, availableSchools: [] });
      } finally {
        authInitializationPromise = null;
      }
    })();

    return authInitializationPromise;
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
