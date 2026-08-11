import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { RequireAuth } from "./guards";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import StudentsPage from "../pages/StudentsPage";
import StudentDetailPage from "../pages/StudentDetailPage";
import TeachersPage from "../pages/TeachersPage";
import ClassesPage from "../pages/ClassesPage";
import AttendancePage from "../pages/AttendancePage";
import FeesPage from "../pages/FeesPage";
import ReportsPage from "../pages/ReportsPage";
import SettingsPage from "../pages/SettingsPage";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> }
    ]
  },
  {
    element: <RequireAuth><AdminLayout /></RequireAuth>,
    children: [
      { path: "/", element: <Navigate to="/dashboard" replace /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/students", element: <StudentsPage /> },
      { path: "/students/:id", element: <StudentDetailPage /> },
      { path: "/teachers", element: <TeachersPage /> },
      { path: "/classes", element: <ClassesPage /> },
      { path: "/attendance", element: <AttendancePage /> },
      { path: "/fees", element: <FeesPage /> },
      { path: "/reports", element: <ReportsPage /> },
      { path: "/settings", element: <SettingsPage /> }
    ]
  }
]);
