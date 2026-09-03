import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { PageLoader } from "../components/ui/Spinner";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function AuthLayout() {
  useDocumentTitle();
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <main className="w-full max-w-md">
      <div className="text-center mb-8"><h1 className="text-3xl font-bold text-primary-600">School ERP</h1><p className="text-gray-500 mt-2">Sign in to your account</p></div>
      <Suspense fallback={<PageLoader className="min-h-[200px]" />}><Outlet /></Suspense>
    </main>
  </div>;
}
