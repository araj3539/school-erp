import { Bell, Menu, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "../../store/uiStore";
import { useAuth } from "../../hooks";

export function Header() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const initials = user?.email?.charAt(0).toUpperCase() || "U";
  const canViewNotifications = ["notices:read", "notices:read:own", "notices:read:child"].some(hasPermission);

  const focusSearch = () => {
    const searchInput = document.querySelector<HTMLInputElement>("input[type='search'], input[placeholder*='Search' i], input[aria-label*='Search' i]");
    if (searchInput) {
      searchInput.focus();
    } else {
      navigate("/students");
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={sidebarOpen}
            aria-controls="app-sidebar"
            className="focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden active:scale-[0.97]"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          
          <div className="min-w-0 lg:hidden flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
              S
            </div>
            <span className="truncate text-sm font-bold tracking-tight text-slate-950">School ERP</span>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <button
              type="button"
              onClick={focusSearch}
              className="flex h-9 w-64 items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 text-xs text-slate-400 transition-colors hover:border-slate-300 hover:bg-white active:scale-[0.99]"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>Search records...</span>
              </span>
              <kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 shadow-sm">
                /
              </kbd>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <time
            dateTime={today.toISOString().slice(0, 10)}
            className="hidden text-xs font-medium text-slate-500 xl:block"
          >
            {today.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </time>

          {canViewNotifications && (
            <button
              type="button"
              onClick={() => navigate("/notifications")}
              aria-label="Open notifications"
              className="focus-ring relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.97]"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          <div className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />

          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-sm"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="max-w-40 truncate text-xs font-bold text-slate-800">{user?.email || "User"}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{user?.role?.replace(/_/g, " ") || "Account"}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
