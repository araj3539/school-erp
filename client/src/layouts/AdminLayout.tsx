import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { PageLoader } from "../components/ui/Spinner";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function AdminLayout() {
  useDocumentTitle();
  return <div className="min-h-screen bg-gray-50">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-700 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500">Skip to main content</a>
    <Sidebar />
    <div className="flex min-h-screen flex-col transition-all duration-200 lg:pl-64">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 p-4 lg:p-6 focus:outline-none">
        <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
      </main>
    </div>
  </div>;
}
