import { useAuth } from "../hooks";
import HomeworkPage from "./HomeworkPage";
import PortalHomeworkPage from "./PortalHomeworkPage";
import TeacherHomeworkPage from "./TeacherHomeworkPage";

export default function RoleAwareHomeworkPage() {
  const { user } = useAuth();
  if (user?.role === "teacher") return <TeacherHomeworkPage />;
  if (user?.role === "student" || user?.role === "parent") return <PortalHomeworkPage />;
  return <HomeworkPage />;
}
