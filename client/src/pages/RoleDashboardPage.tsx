import { useAuth } from "../hooks";
import AdminDashboardPage from "./DashboardPage";
import PortalDashboardPage from "./PortalDashboardPage";
import StudentWorkspacePage from "./StudentWorkspacePage";

const PORTAL_ROLES = new Set(["teacher", "student", "parent"]);

export default function RoleDashboardPage() {
  const { user } = useAuth();
  if (user?.role === "student") return <StudentWorkspacePage />;
  return PORTAL_ROLES.has(user?.role ?? "") ? <PortalDashboardPage /> : <AdminDashboardPage />;
}
