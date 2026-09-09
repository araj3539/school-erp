import { Navigate, useLocation } from "react-router-dom";
import { useAuth, useModules } from "../hooks";
import { useAuthStore } from "../store/authStore";

interface RequireAuthProps { children: React.ReactNode; }
export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

interface RequireRoleProps { children: React.ReactNode; roles: string[]; }
export function RequireRole({ children, roles }: RequireRoleProps) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

interface RequirePermissionProps { children: React.ReactNode; permission: string; }
export function RequirePermission({ children, permission }: RequirePermissionProps) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

interface RequireAnyPermissionProps { children: React.ReactNode; permissions: string[]; }
export function RequireAnyPermission({ children, permissions }: RequireAnyPermissionProps) {
  const { hasAnyPermission } = useAuth();
  if (!hasAnyPermission(permissions)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

interface RequireModuleProps { children: React.ReactNode; moduleId: string; }
export function RequireModule({ children, moduleId }: RequireModuleProps) {
  const { isAuthenticated, user } = useAuth();
  const activeSchoolId = useAuthStore((state) => state.activeSchoolId);
  const { isLoading, isError, isModuleEnabled } = useModules();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === "super_admin" && !user.schoolId && !activeSchoolId) return <>{children}</>;
  if (isLoading) return null;
  if (isError || !isModuleEnabled(moduleId)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
