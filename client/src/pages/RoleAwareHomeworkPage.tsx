import { useAuth } from "../hooks";
import HomeworkPage from "./HomeworkPage";
import TeacherHomeworkPage from "./TeacherHomeworkPage";

export default function RoleAwareHomeworkPage() {
  const { user } = useAuth();
  return user?.role === "teacher" ? <TeacherHomeworkPage /> : <HomeworkPage />;
}
