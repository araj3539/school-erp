import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { PageLoader } from "../components/ui/Spinner";
import { KeyboardShortcutHud } from "../components/workspace/KeyboardShortcutHud";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function AdminLayout() {
  useDocumentTitle();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary-100 selection:text-primary-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-700 focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500">Skip to main content</a>
      <Sidebar />
      <div className="flex min-h-screen flex-col transition-[padding] duration-200 lg:pl-64">
        <Header />
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1680px] flex-1 p-4 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary-500 sm:p-6 lg:p-8">
          <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
        </main>
      </div>
      <KeyboardShortcutHud />
    </div>
  );
}
