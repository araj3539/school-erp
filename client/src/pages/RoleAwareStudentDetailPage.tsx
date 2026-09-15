import { useAuth } from "../hooks";
import StudentDetailPage from "./StudentDetailPage";
import PortalStudentDetailPage from "./PortalStudentDetailPage";
import StudentSiblingsPanel from "../components/students/StudentSiblingsPanel";
import StudentFeeManagementPanel from "../components/fees/StudentFeeManagementPanel";
import Student360Panel from "../components/students/Student360Panel";
import { useParams } from "react-router-dom";

const PORTAL_ROLES = new Set(["teacher", "student", "parent"]);

export default function RoleAwareStudentDetailPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  if (PORTAL_ROLES.has(user?.role ?? "")) return <PortalStudentDetailPage />;
  return (
    <div className="space-y-5">
      <StudentDetailPage />
      <Student360Panel studentId={id} />
      <StudentSiblingsPanel studentId={id} editable />
      <StudentFeeManagementPanel studentId={id} editable />
    </div>
  );
}
