import { useAuth } from "../hooks";
import AdminDashboardPage from "./DashboardPage";
import PortalDashboardPage from "./PortalDashboardPage";

const PORTAL_ROLES = new Set(["teacher", "student", "parent"]);

export default function RoleDashboardPage() {
  const { user } = useAuth();
  return PORTAL_ROLES.has(user?.role ?? "") ? <PortalDashboardPage /> : <AdminDashboardPage />;
}
