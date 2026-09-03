import { Suspense, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ClipboardList, LayoutDashboard, LogOut, Menu, Users, X, BriefcaseBusiness, HeartHandshake } from "lucide-react";
import { useAuth } from "../hooks";
import { cn } from "../utils";
import api from "../lib/api";
import { PageLoader } from "../components/ui/Spinner";

interface PortalNavItem { label: string; path: string; icon: React.ReactNode; permissions: string[]; roles?: string[]; }
const PORTAL_NAV: PortalNavItem[] = [
  { label: "Home", path: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" aria-hidden="true" />, permissions: [] },
  { label: "Family workspace", path: "/parent-workspace", icon: <HeartHandshake className="h-5 w-5" aria-hidden="true" />, permissions: ["students:read:child"], roles: ["parent"] },
  { label: "Teaching workspace", path: "/teacher-workspace", icon: <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />, permissions: ["attendance:read", "timetable:read:own"], roles: ["teacher"] },
  { label: "Homework", path: "/teacher-homework", icon: <ClipboardList className="h-5 w-5" aria-hidden="true" />, permissions: ["homework:write"], roles: ["teacher"] },
  { label: "Homework", path: "/homework", icon: <ClipboardList className="h-5 w-5" aria-hidden="true" />, permissions: ["homework:read:own", "homework:read:child"], roles: ["student", "parent"] },
  { label: "Students", path: "/students", icon: <Users className="h-5 w-5" aria-hidden="true" />, permissions: ["students:read"], roles: ["teacher"] },
];
function roleLabel(role?: string) { return role ? role.replace(/_/g, " ") : ""; }
export function PortalLayout() {
  const { user, hasPermission, logout } = useAuth(); const location = useLocation(); const [open, setOpen] = useState(false); const [isLoggingOut, setIsLoggingOut] = useState(false);
  const items = PORTAL_NAV.filter((item) => (!item.roles || item.roles.includes(user?.role ?? "")) && (item.permissions.length === 0 || item.permissions.some(hasPermission)));
  useEffect(() => setOpen(false), [location.pathname]);
  const handleLogout = async () => { setIsLoggingOut(true); try { await api.post("/auth/logout"); } catch { /* local session is still cleared */ } finally { setIsLoggingOut(false); logout(); } };
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <a href="#portal-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500">Skip to content</a>
    <aside className={cn("fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}><div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">School ERP</p><p className="mt-0.5 text-sm font-semibold capitalize text-slate-900">{roleLabel(user?.role)} portal</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close navigation menu" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus:ring-primary-500 lg:hidden"><X className="h-5 w-5" aria-hidden="true" /></button></div>
      <nav id="portal-navigation" aria-label="Portal navigation" className="flex-1 space-y-1 overflow-y-auto p-4">{items.map((item) => { const active = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(`${item.path}/`)); return <NavLink key={item.path} to={item.path} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus:ring-primary-500", active ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")}>{item.icon}<span>{item.label}</span></NavLink>; })}</nav>
      <div className="border-t border-slate-200 p-4"><div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700" aria-hidden="true">{user?.email?.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{user?.email}</p><p className="text-xs capitalize text-slate-500">{roleLabel(user?.role)}</p></div></div><button type="button" onClick={handleLogout} disabled={isLoggingOut} className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus:ring-primary-500 disabled:opacity-50"><LogOut className="h-5 w-5" aria-hidden="true" />{isLoggingOut ? "Signing out..." : "Sign out"}</button></div>
    </div></aside>
    {open && <button type="button" aria-label="Close navigation overlay" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)} />}
    <div className="min-h-screen lg:pl-72"><header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6"><div className="flex items-center gap-3"><button type="button" onClick={() => setOpen(true)} aria-label="Open navigation menu" aria-expanded={open} aria-controls="portal-navigation" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus:ring-primary-500 lg:hidden"><Menu className="h-5 w-5" aria-hidden="true" /></button><div><p className="text-sm font-semibold text-slate-900">{user?.email}</p><p className="text-xs capitalize text-slate-500">{roleLabel(user?.role)}</p></div></div><time dateTime={new Date().toISOString().slice(0, 10)} className="hidden text-sm text-slate-500 sm:block">{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</time></div></header><main id="portal-main" tabIndex={-1} className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8 focus:outline-none"><Suspense fallback={<PageLoader />}><Outlet /></Suspense></main></div>
  </div>;
}
