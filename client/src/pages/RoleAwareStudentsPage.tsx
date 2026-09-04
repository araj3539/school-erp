import { useAuth } from "../hooks";
import StudentsPage from "./StudentsPage";
import PortalStudentsPage from "./PortalStudentsPage";

const PORTAL_ROLES = new Set(["teacher", "student", "parent"]);

export default function RoleAwareStudentsPage() {
  const { user } = useAuth();
  return PORTAL_ROLES.has(user?.role ?? "") ? <PortalStudentsPage /> : <StudentsPage />;
}
