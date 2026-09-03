import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { RequireAuth } from "./guards";
import RouteErrorPage from "../pages/RouteErrorPage";

const LoginPage = lazy(() => import("../pages/LoginPage"));
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const StudentsPage = lazy(() => import("../pages/StudentsPage"));
const StudentBulkOperationsPage = lazy(() => import("../pages/StudentBulkOperationsPage"));
const StudentDetailPage = lazy(() => import("../pages/StudentDetailPage"));
const StudentDocumentRecoveryPage = lazy(() => import("../pages/StudentDocumentRecoveryPage"));
const DocumentRecoveryPage = lazy(() => import("../pages/DocumentRecoveryPage"));
const TeachersPage = lazy(() => import("../pages/TeachersPage"));
const ClassesPage = lazy(() => import("../pages/ClassesPage"));
const AttendancePage = lazy(() => import("../pages/AttendancePage"));
const ExamsPage = lazy(() => import("../pages/ExamsPage"));
const HomeworkPage = lazy(() => import("../pages/HomeworkPage"));
const NoticesPage = lazy(() => import("../pages/NoticesPage"));
const FeesPage = lazy(() => import("../pages/FeesPage"));
const ReportsPage = lazy(() => import("../pages/ReportsPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

export const router = createBrowserRouter([
  { element: <AuthLayout />, errorElement: <RouteErrorPage />, children: [{ path: "/login", element: <LoginPage /> }] },
  {
    element: <RequireAuth><AdminLayout /></RequireAuth>,
    errorElement: <RouteErrorPage />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" replace /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/students", element: <StudentsPage /> },
      { path: "/students/bulk", element: <StudentBulkOperationsPage /> },
      { path: "/students/:id", element: <StudentDetailPage /> },
      { path: "/document-recovery", element: <DocumentRecoveryPage /> },
      { path: "/students/:id/document-recovery", element: <StudentDocumentRecoveryPage /> },
      { path: "/teachers", element: <TeachersPage /> },
      { path: "/classes", element: <ClassesPage /> },
      { path: "/attendance", element: <AttendancePage /> },
      { path: "/exams", element: <ExamsPage /> },
      { path: "/homework", element: <HomeworkPage /> },
      { path: "/notices", element: <NoticesPage /> },
      { path: "/fees", element: <FeesPage /> },
      { path: "/reports", element: <ReportsPage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);
