import { useAuth } from "../hooks";
import AdminDashboardPage from "./DashboardPage";
import PortalHomePage from "./PortalHomePage";

const PORTAL_ROLES = new Set(["teacher", "student", "parent"]);

export default function RoleDashboardPage() {
  const { user } = useAuth();
  return PORTAL_ROLES.has(user?.role ?? "") ? <PortalHomePage /> : <AdminDashboardPage />;
}
