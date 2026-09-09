import { Bell, Menu } from "lucide-react";
import { useUIStore } from "../../store/uiStore";
import { useAuth } from "../../hooks";

export function Header() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuth();
  const today = new Date();
  const initials = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="flex min-h-[4.5rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={sidebarOpen}
            aria-controls="app-sidebar"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 lg:hidden">
            <p className="truncate text-base font-bold tracking-tight text-slate-950">School ERP</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-600">Management workspace</p>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-slate-900">Good to see you</p>
            <p className="mt-0.5 text-xs text-slate-500">{today.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <time dateTime={today.toISOString().slice(0, 10)} className="hidden text-xs font-medium text-slate-500 xl:block">
            {today.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </time>
          <button type="button" aria-label="Notifications" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <div className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white shadow-sm shadow-primary-600/20" aria-hidden="true">
              {initials}
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="max-w-44 truncate text-sm font-semibold text-slate-800">{user?.email || "User"}</p>
              <p className="text-xs capitalize text-slate-500">{user?.role?.replace(/_/g, " ") || "Account"}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
