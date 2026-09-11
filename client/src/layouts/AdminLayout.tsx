import { Suspense } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { PageLoader } from "../components/ui/Spinner";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { LayoutDashboard, Users, Calendar, DollarSign, Menu } from "lucide-react";
import { useUIStore } from "../store/uiStore";
import { cn } from "../utils";

export function AdminLayout() {
  useDocumentTitle();
  const location = useLocation();
  const { toggleSidebar } = useUIStore();

  const mobileNavItems = [
    { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { label: "Students", path: "/students", icon: Users },
    { label: "Attendance", path: "/attendance", icon: Calendar },
    { label: "Fees", path: "/fees", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-sky-100 selection:text-sky-900 pb-20 lg:pb-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-sky-700 focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex min-h-screen flex-col transition-[padding] duration-200 lg:pl-64">
        <Header />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1680px] flex-1 p-4 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-sky-500 sm:p-6 lg:p-8"
        >
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Modern Mobile Bottom Navigation Dock */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-slate-200/90 bg-white/95 px-3 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl lg:hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-all active:scale-[0.95]",
                active ? "text-sky-600 font-bold" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Open full workspace menu"
          className="flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-semibold text-slate-500 hover:text-slate-900 active:scale-[0.95]"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
