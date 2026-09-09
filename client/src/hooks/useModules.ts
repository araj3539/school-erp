import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "./useAuth";
import { useAuthStore } from "../store/authStore";

export interface ModuleEntitlement {
  moduleId: string;
  enabled: boolean;
  defaultEnabled: boolean;
}

export function useModules() {
  const { user, isAuthenticated } = useAuth();
  const activeSchoolId = useAuthStore((state) => state.activeSchoolId);
  const tenantContextId = user?.schoolId ? String(user.schoolId) : activeSchoolId;
  const query = useQuery<ModuleEntitlement[]>({
    queryKey: ["module-entitlements", tenantContextId],
    queryFn: async () => (await api.get<{ data: ModuleEntitlement[] }>("/modules")).data.data,
    enabled: isAuthenticated && Boolean(tenantContextId),
    staleTime: 60_000,
  });

  const isModuleEnabled = (moduleId: string) => {
    if (user?.role === "super_admin" && !tenantContextId) return true;
    return query.data?.some((module) => module.moduleId === moduleId && module.enabled) ?? false;
  };

  return { ...query, isModuleEnabled };
}
