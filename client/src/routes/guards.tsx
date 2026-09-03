import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks";

interface RequireAuthProps { children: React.ReactNode; }
export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, hasHydrated } = useAuth();
  const location = useLocation();
  if (!hasHydrated) return null;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

interface RequireRoleProps { children: React.ReactNode; roles: string[]; }
export function RequireRole({ children, roles }: RequireRoleProps) {
  const { user, isAuthenticated, hasHydrated } = useAuth();
  if (!hasHydrated) return null;
  if (!isAuthenticated || !user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

interface RequirePermissionProps { children: React.ReactNode; permission: string; }
export function RequirePermission({ children, permission }: RequirePermissionProps) {
  const { hasPermission, hasHydrated } = useAuth();
  if (!hasHydrated) return null;
  if (!hasPermission(permission)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

interface RequireAnyPermissionProps { children: React.ReactNode; permissions: string[]; }
export function RequireAnyPermission({ children, permissions }: RequireAnyPermissionProps) {
  const { hasAnyPermission, hasHydrated } = useAuth();
  if (!hasHydrated) return null;
  if (!hasAnyPermission(permissions)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
