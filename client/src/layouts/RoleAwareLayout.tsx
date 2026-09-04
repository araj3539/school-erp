import { useAuth } from "../hooks";
import { AdminLayout } from "./AdminLayout";
import { PortalLayout } from "./PortalLayout";

export function RoleAwareLayout() {
  const { user } = useAuth();
  const portalRoles = new Set(["teacher", "student", "parent"]);
  return portalRoles.has(user?.role ?? "") ? <PortalLayout /> : <AdminLayout />;
}
