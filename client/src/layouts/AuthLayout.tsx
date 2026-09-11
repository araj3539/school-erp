import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { PageLoader } from "../components/ui/Spinner";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { CalendarCheck, Receipt, Users2 } from "lucide-react";

export function AuthLayout() {
  useDocumentTitle();
  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div className="flex-1 grid lg:grid-cols-12 min-h-[100dvh]">
        {/* Left Editorial Branding Panel */}
        <section className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col justify-between p-10 xl:p-14 bg-white border-r border-slate-200/80">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">
                S
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                School ERP
              </span>
            </div>

            <div className="mt-20">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                Institutional management, simplified.
              </h2>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-sm">
                A single system connecting school administration, educators, students, and parents with role-tailored workspaces.
              </p>

              <div className="mt-10 space-y-4 border-t border-slate-100 pt-8">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                    <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Academic Operations</p>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time attendance rosters, timetables, and exam records.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                    <Receipt className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Fee Administration</p>
                    <p className="text-xs text-slate-500 mt-0.5">Automated fee structures, collection logs, and student receipts.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                    <Users2 className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Family and Student Portals</p>
                    <p className="text-xs text-slate-500 mt-0.5">Direct communication, homework submission, and report cards.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 text-xs text-slate-400">
            Enterprise multi-tenant infrastructure
          </div>
        </section>

        {/* Right Authentication Form Viewport */}
        <main className="lg:col-span-7 xl:col-span-8 flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                S
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                School ERP
              </span>
            </div>

            <Suspense fallback={<PageLoader className="min-h-[200px]" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
