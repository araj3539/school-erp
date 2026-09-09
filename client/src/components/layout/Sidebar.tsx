import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useUIStore } from "../../store/uiStore";
import { cn } from "../../utils";
import { LayoutDashboard, Users, UserCheck, Building2, Calendar, CalendarClock, DollarSign, BarChart3, Settings, LogOut, ArchiveRestore, FileSpreadsheet, BookOpen, ClipboardList, Megaphone, Package, BriefcaseBusiness, X } from "lucide-react";
import { useAuth } from "../../hooks";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/api";

interface NavItem { label: string; path: string; icon: React.ReactNode; permissions?: string[]; }
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="h-[18px] w-[18px]" aria-hidden="true" /> },
  { label: "Students", path: "/students", icon: <Users className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["students:read"] },
  { label: "Student Import & Export", path: "/students/bulk", icon: <FileSpreadsheet className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["students:read"] },
  { label: "Document Recovery", path: "/document-recovery", icon: <ArchiveRestore className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["students:read"] },
  { label: "Teachers", path: "/teachers", icon: <UserCheck className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["teachers:read"] },
  { label: "Classes", path: "/classes", icon: <Building2 className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["classes:read"] },
  { label: "Attendance", path: "/attendance", icon: <Calendar className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["attendance:read"] },
  { label: "Exams & Results", path: "/exams", icon: <BookOpen className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["exams:read", "marks:read", "results:read", "results:read:own", "results:read:child"] },
  { label: "Homework", path: "/homework", icon: <ClipboardList className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["homework:read", "homework:read:own", "homework:read:child"] },
  { label: "Notices", path: "/notices", icon: <Megaphone className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["notices:read"] },
  { label: "Timetable", path: "/timetable", icon: <CalendarClock className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["timetable:read", "timetable:read:own", "timetable:read:child"] },
  { label: "Fees", path: "/fees", icon: <DollarSign className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["fees:read"] },
  { label: "Operations", path: "/operations", icon: <BriefcaseBusiness className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["staff:read", "library:read", "transport:read", "inventory:read"] },
  { label: "Inventory", path: "/inventory", icon: <Package className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["inventory:read"] },
  { label: "Reports", path: "/reports", icon: <BarChart3 className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["reports:read"] },
  { label: "Settings", path: "/settings", icon: <Settings className="h-[18px] w-[18px]" aria-hidden="true" />, permissions: ["settings:read"] }
];

function formatRole(role?: string) { return role ? role.replace(/_/g, " ") : ""; }

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user, hasPermission, logout } = useAuth();
  const { activeSchoolId, availableSchools, setActiveSchoolId } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const filteredItems = NAV_ITEMS.filter(item => !item.permissions || item.permissions.some(p => hasPermission(p)));

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
    try { await api.post("/auth/logout"); } catch (_error) { /* local session is still cleared */ }
    finally { setIsLoggingOut(false); logout(); }
  };

  return (
    <>
      <aside id="app-sidebar" className={cn("fixed inset-y-0 left-0 z-40 w-64 -translate-x-full border-r border-slate-200/80 bg-white transition-transform duration-200 lg:translate-x-0", sidebarOpen && "translate-x-0")}>
        <div className="flex h-full flex-col">
          <div className="flex h-[4.5rem] items-center justify-between border-b border-slate-100 px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-sm font-extrabold text-white shadow-sm shadow-primary-600/20" aria-hidden="true">S</div>
              <div>
                <h1 className="text-[15px] font-extrabold tracking-tight text-slate-950">School ERP</h1>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.17em] text-primary-600">Management</p>
              </div>
            </div>
            <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation menu" className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"><X className="h-5 w-5" aria-hidden="true" /></button>
          </div>

          {user?.role === "super_admin" && availableSchools.length > 0 && (
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <label htmlFor="active-school" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Active school</label>
              <select id="active-school" value={activeSchoolId ?? ""} onChange={event => setActiveSchoolId(event.target.value || null)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
                {availableSchools.map(school => <option key={school.id} value={school.id}>{school.name} ({school.code})</option>)}
              </select>
            </div>
          )}

          <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
            <div className="space-y-1">
              {filteredItems.map(item => {
                const active = isItemActive(item.path);
                return <NavLink key={item.path} to={item.path} aria-current={active ? "page" : undefined} className={cn("group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500", active ? "bg-primary-50 text-primary-700 shadow-sm shadow-primary-100/70" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}>{item.icon}<span className="truncate">{item.label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-600" aria-hidden="true" />}</NavLink>;
              })}
            </div>
          </nav>

          <div className="border-t border-slate-100 p-3">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center gap-3 px-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700" aria-hidden="true"><span className="text-sm font-bold">{user?.email?.charAt(0).toUpperCase()}</span></div>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800" title={user?.email}>{user?.email}</p><p className="mt-0.5 truncate text-[10px] font-medium capitalize text-slate-500">{formatRole(user?.role)}</p></div>
              </div>
              <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="mt-3 flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50"><LogOut className="h-[17px] w-[17px]" aria-hidden="true" />{isLoggingOut ? "Signing out..." : "Sign out"}</button>
            </div>
          </div>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
    </>
  );
}
