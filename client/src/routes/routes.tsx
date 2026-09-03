import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RoleAwareLayout } from "../layouts/RoleAwareLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { RequireAnyPermission, RequireAuth, RequirePermission, RequireRole } from "./guards";
import RouteErrorPage from "../pages/RouteErrorPage";
const LoginPage = lazy(() => import("../pages/LoginPage"));
const DashboardPage = lazy(() => import("../pages/RoleDashboardPage"));
const StudentsPage = lazy(() => import("../pages/RoleAwareStudentsPage"));
const StudentDetailPage = lazy(() => import("../pages/RoleAwareStudentDetailPage"));
const StudentBulkOperationsPage = lazy(() => import("../pages/StudentBulkOperationsPage"));
const StudentDocumentRecoveryPage = lazy(() => import("../pages/StudentDocumentRecoveryPage"));
const DocumentRecoveryPage = lazy(() => import("../pages/DocumentRecoveryPage"));
const TeachersPage = lazy(() => import("../pages/TeachersPage"));
const ClassesPage = lazy(() => import("../pages/ClassesPage"));
const AttendancePage = lazy(() => import("../pages/AttendancePage"));
const PortalAttendancePage = lazy(() => import("../pages/PortalAttendancePage"));
const PortalResultsPage = lazy(() => import("../pages/PortalResultsPage"));
const PortalFeesPage = lazy(() => import("../pages/PortalFeesPage"));
const TeacherWorkspacePage = lazy(() => import("../pages/TeacherWorkspacePage"));
const TeacherHomeworkPage = lazy(() => import("../pages/TeacherHomeworkPage"));
const RoleAwareHomeworkPage = lazy(() => import("../pages/RoleAwareHomeworkPage"));
const StudentWorkspacePage = lazy(() => import("../pages/StudentWorkspacePage"));
const ParentWorkspacePage = lazy(() => import("../pages/ParentWorkspacePage"));
const ExamsPage = lazy(() => import("../pages/ExamsPage"));
const NoticesPage = lazy(() => import("../pages/NoticesPage"));
const TimetablePage = lazy(() => import("../pages/TimetablePage"));
const FeesPage = lazy(() => import("../pages/FeesPage"));
const ReportsPage = lazy(() => import("../pages/ReportsPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const PortalDashboardPage = lazy(() => import("../pages/PortalDashboardPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const any = (permissions: string[], element: React.ReactNode) => <RequireAnyPermission permissions={permissions}>{element}</RequireAnyPermission>;
const only = (permission: string, element: React.ReactNode) => <RequirePermission permission={permission}>{element}</RequirePermission>;
const role = (roles: string[], element: React.ReactNode) => <RequireRole roles={roles}>{element}</RequireRole>;
const adminRoles = ["principal", "accountant", "super_admin"];
const portalRoles = ["teacher", "student", "parent"];
export const router = createBrowserRouter([
  { element: <AuthLayout />, errorElement: <RouteErrorPage />, children: [{ path: "/login", element: <LoginPage /> }] },
  { element: <RequireAuth><RoleAwareLayout /></RequireAuth>, errorElement: <RouteErrorPage />, children: [
    { path: "/", element: <Navigate to="/dashboard" replace /> },
    { path: "/dashboard", element: <DashboardPage /> },
    { path: "/portal-dashboard", element: role(portalRoles, any(["attendance:read", "attendance:read:own", "attendance:read:child"], <PortalDashboardPage />)) },
    { path: "/student-workspace", element: role(["student"], only("students:read:own", <StudentWorkspacePage />)) },
    { path: "/parent-workspace", element: role(["parent"], only("students:read:child", <ParentWorkspacePage />)) },
    { path: "/teacher-workspace", element: role(["teacher"], any(["attendance:read", "timetable:read:own"], <TeacherWorkspacePage />)) },
    { path: "/teacher-homework", element: role(["teacher"], only("homework:write", <TeacherHomeworkPage />)) },
    { path: "/attendance", element: role(adminRoles, only("attendance:read", <AttendancePage />)) },
    { path: "/portal-attendance", element: role(["student", "parent"], any(["attendance:read:own", "attendance:read:child"], <PortalAttendancePage />)) },
    { path: "/portal-results", element: role(["student", "parent"], any(["results:read:own", "results:read:child"], <PortalResultsPage />)) },
    { path: "/portal-fees", element: role(["student", "parent"], any(["fees:read:own", "fees:read:child"], <PortalFeesPage />)) },
    { path: "/students", element: any(["students:read", "students:read:own", "students:read:child"], <StudentsPage />) },
    { path: "/students/bulk", element: only("students:write", <StudentBulkOperationsPage />) },
    { path: "/students/:id", element: any(["students:read", "students:read:own", "students:read:child"], <StudentDetailPage />) },
    { path: "/document-recovery", element: only("students:read", <DocumentRecoveryPage />) },
    { path: "/students/:id/document-recovery", element: only("students:read", <StudentDocumentRecoveryPage />) },
    { path: "/teachers", element: only("teachers:read", <TeachersPage />) },
    { path: "/classes", element: only("classes:read", <ClassesPage />) },
    { path: "/exams", element: role(adminRoles, any(["exams:read", "marks:read", "results:read"], <ExamsPage />)) },
    { path: "/homework", element: any(["homework:read", "homework:read:own", "homework:read:child", "homework:write"], <RoleAwareHomeworkPage />) },
    { path: "/notices", element: role(adminRoles, only("notices:read", <NoticesPage />)) },
    { path: "/timetable", element: role(adminRoles, only("timetable:read", <TimetablePage />) ) },
    { path: "/fees", element: role(adminRoles, only("fees:read", <FeesPage />)) },
    { path: "/reports", element: only("reports:read", <ReportsPage />) },
    { path: "/settings", element: only("settings:read", <SettingsPage />) },
    { path: "*", element: <NotFoundPage /> }
  ] }
]);