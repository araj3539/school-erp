import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useUIStore } from "../../store/uiStore";
import { cn } from "../../utils";
import { LayoutDashboard, Users, UserCheck, Building2, Calendar, DollarSign, BarChart3, Settings, LogOut, ArchiveRestore, FileSpreadsheet, BookOpen, X } from "lucide-react";
import { useAuth } from "../../hooks";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/api";

interface NavItem { label: string; path: string; icon: React.ReactNode; permissions?: string[]; }
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" aria-hidden="true" /> },
  { label: "Students", path: "/students", icon: <Users className="w-5 h-5" aria-hidden="true" />, permissions: ["students:read"] },
  { label: "Student Import & Export", path: "/students/bulk", icon: <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />, permissions: ["students:read"] },
  { label: "Document Recovery", path: "/document-recovery", icon: <ArchiveRestore className="w-5 h-5" aria-hidden="true" />, permissions: ["students:read"] },
  { label: "Teachers", path: "/teachers", icon: <UserCheck className="w-5 h-5" aria-hidden="true" />, permissions: ["teachers:read"] },
  { label: "Classes", path: "/classes", icon: <Building2 className="w-5 h-5" aria-hidden="true" />, permissions: ["classes:read"] },
  { label: "Attendance", path: "/attendance", icon: <Calendar className="w-5 h-5" aria-hidden="true" />, permissions: ["attendance:read"] },
  { label: "Exams & Results", path: "/exams", icon: <BookOpen className="w-5 h-5" aria-hidden="true" />, permissions: ["exams:read", "marks:read", "results:read", "results:read:own", "results:read:child"] },
  { label: "Fees", path: "/fees", icon: <DollarSign className="w-5 h-5" aria-hidden="true" />, permissions: ["fees:read"] },
  { label: "Reports", path: "/reports", icon: <BarChart3 className="w-5 h-5" aria-hidden="true" />, permissions: ["reports:read"] },
  { label: "Settings", path: "/settings", icon: <Settings className="w-5 h-5" aria-hidden="true" />, permissions: ["settings:read"] }
];

function formatRole(role?: string) { return role ? role.replace(/_/g, " ") : ""; }

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user, hasPermission, logout } = useAuth();
  const { activeSchoolId, availableSchools, setActiveSchoolId } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const filteredItems = NAV_ITEMS.filter((item) => !item.permissions || item.permissions.some((p) => hasPermission(p)));

  useEffect(() => { setSidebarOpen(false); }, [location.pathname, setSidebarOpen]);
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setSidebarOpen(false); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

  const isItemActive = (path: string) => {
    const { pathname } = location;
    if (pathname === path) return true;
    if (!pathname.startsWith(`${path}/`)) return false;
    if (path === "/students" && pathname.startsWith("/students/bulk")) return false;
    return true;
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await api.post("/auth/logout"); } catch { /* local session is still cleared */ }
    finally { setIsLoggingOut(false); logout(); }
  };

  return <>
    <aside id="app-sidebar" className={cn("fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-200 lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">School ERP</h1>
          <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation menu" className="lg:hidden rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"><X className="w-6 h-6" aria-hidden="true" /></button>
        </div>
        {user?.role === "super_admin" && availableSchools.length > 0 && <div className="px-4 py-3 border-b border-gray-200"><label htmlFor="active-school" className="block text-xs font-medium text-gray-500 mb-1">Active School</label><select id="active-school" value={activeSchoolId ?? ""} onChange={(event) => setActiveSchoolId(event.target.value || null)} className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500">{availableSchools.map((school) => <option key={school.id} value={school.id}>{school.name} ({school.code})</option>)}</select></div>}
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredItems.map((item) => { const active = isItemActive(item.path); return <NavLink key={item.path} to={item.path} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500", active ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}>{item.icon}<span className="truncate">{item.label}</span></NavLink>; })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2"><div className="w-8 h-8 shrink-0 rounded-full bg-primary-100 flex items-center justify-center" aria-hidden="true"><span className="text-sm font-medium text-primary-700">{user?.email?.charAt(0).toUpperCase()}</span></div><div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate" title={user?.email}>{user?.email}</p><p className="text-xs text-gray-500 capitalize">{formatRole(user?.role)}</p></div></div>
          <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="mt-3 w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"><LogOut className="w-5 h-5" aria-hidden="true" />{isLoggingOut ? "Signing out..." : "Logout"}</button>
        </div>
      </div>
    </aside>
    {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
  </>;
}
