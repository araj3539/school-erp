import { useAuth } from "../hooks";
import StudentDetailPage from "./StudentDetailPage";
import PortalStudentDetailPage from "./PortalStudentDetailPage";

const PORTAL_ROLES = new Set(["teacher", "student", "parent"]);

export default function RoleAwareStudentDetailPage() {
  const { user } = useAuth();
  return PORTAL_ROLES.has(user?.role ?? "") ? <PortalStudentDetailPage /> : <StudentDetailPage />;
}
