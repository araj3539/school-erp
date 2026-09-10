import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RoleAwareLayout } from "../layouts/RoleAwareLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { RequireAnyPermission, RequireAuth, RequirePermission, RequireRole, RequireModule } from "./guards";
import RouteErrorPage from "../pages/RouteErrorPage";
const LoginPage = lazy(() => import("../pages/LoginPage")); const DashboardPage = lazy(() => import("../pages/RoleDashboardPage")); const AnalyticsPage = lazy(() => import("../pages/AnalyticsPage")); const StudentsPage = lazy(() => import("../pages/RoleAwareStudentsPage")); const StudentDetailPage = lazy(() => import("../pages/RoleAwareStudentDetailPage")); const StudentBulkOperationsPage = lazy(() => import("../pages/StudentBulkOperationsPage")); const StudentDocumentRecoveryPage = lazy(() => import("../pages/StudentDocumentRecoveryPage")); const DocumentRecoveryPage = lazy(() => import("../pages/DocumentRecoveryPage")); const TeachersPage = lazy(() => import("../pages/TeachersPage")); const ClassesPage = lazy(() => import("../pages/ClassesPage")); const AttendancePage = lazy(() => import("../pages/AttendancePage")); const PortalAttendancePage = lazy(() => import("../pages/PortalAttendancePage")); const PortalResultsPage = lazy(() => import("../pages/PortalResultsPage")); const PortalFeesPage = lazy(() => import("../pages/PortalFeesPage")); const PortalTimetablePage = lazy(() => import("../pages/PortalTimetablePage")); const PortalNoticesPage = lazy(() => import("../pages/PortalNoticesPage")); const NotificationsPage = lazy(() => import("../pages/NotificationsPage")); const TeacherWorkspacePage = lazy(() => import("../pages/TeacherWorkspacePage")); const TeacherHomeworkPage = lazy(() => import("../pages/TeacherHomeworkPage")); const RoleAwareHomeworkPage = lazy(() => import("../pages/RoleAwareHomeworkPage")); const StudentWorkspacePage = lazy(() => import("../pages/StudentWorkspacePage")); const ParentWorkspacePage = lazy(() => import("../pages/ParentWorkspacePage")); const ExamsPage = lazy(() => import("../pages/ExamsPage")); const NoticesPage = lazy(() => import("../pages/NoticesPage")); const TimetablePage = lazy(() => import("../pages/TimetablePage")); const FeesPage = lazy(() => import("../pages/FeesPage")); const ReportsPage = lazy(() => import("../pages/ReportsPage")); const SettingsPage = lazy(() => import("../pages/SettingsPage")); const InventoryPage = lazy(() => import("../pages/InventoryPage")); const StaffPage = lazy(() => import("../pages/StaffPage")); const LibraryPage = lazy(() => import("../pages/LibraryPage")); const TransportPage = lazy(() => import("../pages/TransportPage")); const OperationsPage = lazy(() => import("../pages/OperationsPage")); const PortalDashboardPage = lazy(() => import("../pages/PortalDashboardPage")); const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const any = (permissions: string[], element: React.ReactNode) => <RequireAnyPermission permissions={permissions}>{element}</RequireAnyPermission>; const only = (permission: string, element: React.ReactNode) => <RequirePermission permission={permission}>{element}</RequirePermission>; const role = (roles: string[], element: React.ReactNode) => <RequireRole roles={roles}>{element}</RequireRole>; const mod = (moduleId: string, element: React.ReactNode) => <RequireModule moduleId={moduleId}>{element}</RequireModule>; const adminRoles = ["principal", "accountant", "super_admin"]; const portalRoles = ["teacher", "student", "parent"];
export const router = createBrowserRouter([{ element: <AuthLayout />, errorElement: <RouteErrorPage />, children: [{ path: "/login", element: <LoginPage /> }] }, { element: <RequireAuth><RoleAwareLayout /></RequireAuth>, errorElement: <RouteErrorPage />, children: [
{ path: "/", element: <Navigate to="/dashboard" replace /> },
{ path: "/dashboard", element: mod("dashboard", <DashboardPage />) },
{ path: "/analytics", element: mod("dashboard", only("reports:read", <AnalyticsPage />)) },
{ path: "/notifications", element: mod("notifications", any(["notices:read", "notices:read:own", "notices:read:child"], <NotificationsPage />)) },
{ path: "/portal-dashboard", element: mod("portal", role(portalRoles, any(["attendance:read", "attendance:read:own", "attendance:read:child"], <PortalDashboardPage />))) },
{ path: "/student-workspace", element: mod("students", role(["student"], only("students:read:own", <StudentWorkspacePage />))) },
{ path: "/parent-workspace", element: mod("parents", role(["parent"], only("students:read:child", <ParentWorkspacePage />))) },
{ path: "/teacher-workspace", element: mod("attendance", role(["teacher"], any(["attendance:read", "timetable:read:own"], <TeacherWorkspacePage />))) },
{ path: "/teacher-homework", element: mod("homework", role(["teacher"], only("homework:write", <TeacherHomeworkPage />))) },
{ path: "/attendance", element: mod("attendance", role(adminRoles, only("attendance:read", <AttendancePage />))) },
{ path: "/portal-attendance", element: mod("portal", role(["student", "parent"], any(["attendance:read:own", "attendance:read:child"], <PortalAttendancePage />))) },
{ path: "/portal-results", element: mod("portal", role(["student", "parent"], any(["results:read:own", "results:read:child"], <PortalResultsPage />))) },
{ path: "/portal-fees", element: mod("portal", role(["student", "parent"], any(["fees:read:own", "fees:read:child"], <PortalFeesPage />))) },
{ path: "/portal-timetable", element: mod("portal", role(portalRoles, any(["timetable:read:own", "timetable:read:child"], <PortalTimetablePage />))) },
{ path: "/portal-notices", element: mod("portal", role(portalRoles, only("notices:read", <PortalNoticesPage />))) },
{ path: "/students", element: mod("students", any(["students:read", "students:read:own", "students:read:child"], <StudentsPage />)) },
{ path: "/students/bulk", element: mod("students", only("students:write", <StudentBulkOperationsPage />) ) },
{ path: "/students/:id", element: mod("students", any(["students:read", "students:read:own", "students:read:child"], <StudentDetailPage />)) },
{ path: "/document-recovery", element: mod("students", only("students:read", <DocumentRecoveryPage />)) },
{ path: "/students/:id/document-recovery", element: mod("students", only("students:read", <StudentDocumentRecoveryPage />)) },
{ path: "/teachers", element: mod("teachers", only("teachers:read", <TeachersPage />)) },
{ path: "/classes", element: mod("academics", only("classes:read", <ClassesPage />)) },
{ path: "/exams", element: mod("exams", role(adminRoles, any(["exams:read", "marks:read", "results:read"], <ExamsPage />))) },
{ path: "/homework", element: mod("homework", any(["homework:read", "homework:read:own", "homework:read:child", "homework:write"], <RoleAwareHomeworkPage />)) },
{ path: "/notices", element: mod("notices", role(adminRoles, only("notices:read", <NoticesPage />))) },
{ path: "/timetable", element: mod("timetable", role(adminRoles, only("timetable:read", <TimetablePage />))) },
{ path: "/fees", element: mod("fees", role(adminRoles, only("fees:read", <FeesPage />))) },
{ path: "/operations", element: any(["staff:read", "library:read", "transport:read", "inventory:read"], <OperationsPage />) },
{ path: "/staff", element: mod("staff", only("staff:read", <StaffPage />)) },
{ path: "/library", element: mod("library", only("library:read", <LibraryPage />)) },
{ path: "/transport", element: mod("transport", only("transport:read", <TransportPage />)) },
{ path: "/inventory", element: mod("inventory", only("inventory:read", <InventoryPage />)) },
{ path: "/reports", element: mod("reports", only("reports:read", <ReportsPage />)) },
{ path: "/settings", element: only("settings:read", <SettingsPage />) },
{ path: "*", element: <NotFoundPage /> }
] }]);
