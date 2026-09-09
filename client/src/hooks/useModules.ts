import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "./useAuth";

export interface ModuleEntitlement {
  moduleId: string;
  enabled: boolean;
  defaultEnabled: boolean;
}

export function useModules() {
  const { user, isAuthenticated } = useAuth();
  const query = useQuery<ModuleEntitlement[]>({
    queryKey: ["module-entitlements", user?.schoolId],
    queryFn: async () => (await api.get<{ data: ModuleEntitlement[] }>("/modules")).data.data,
    enabled: isAuthenticated && Boolean(user?.schoolId),
    staleTime: 60_000,
  });

  const isModuleEnabled = (moduleId: string) => {
    if (user?.role === "super_admin" && !user.schoolId) return true;
    return query.data?.some((module) => module.moduleId === moduleId && module.enabled) ?? false;
  };

  return { ...query, isModuleEnabled };
}
