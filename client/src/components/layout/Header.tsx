import { Menu } from "lucide-react";
import { useUIStore } from "../../store/uiStore";

export function Header() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const today = new Date();
  return <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
    <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={toggleSidebar} aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={sidebarOpen} aria-controls="app-sidebar" className="lg:hidden rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"><Menu className="w-6 h-6" aria-hidden="true" /></button>
        <span className="lg:hidden text-lg font-bold text-primary-600">School ERP</span>
      </div>
      <time dateTime={today.toISOString().slice(0, 10)} className="hidden sm:block text-sm text-gray-500">{today.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</time>
    </div>
  </header>;
}
