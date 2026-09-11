import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { PageLoader } from "../components/ui/Spinner";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { ShieldCheck, Sparkles, Building2, CheckCircle2 } from "lucide-react";

export function AuthLayout() {
  useDocumentTitle();
  return (
    <div className="min-h-[100dvh] bg-slate-50 p-3 sm:p-5 lg:p-8 selection:bg-sky-100 selection:text-sky-900">
      <main className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:min-h-[calc(100dvh-2.5rem)] lg:grid-cols-[0.95fr_1.05fr] lg:min-h-[calc(100dvh-4rem)]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-sky-600/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]" aria-hidden="true" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 font-black text-white shadow-md shadow-sky-600/30">
                S
              </div>
              <div>
                <p className="text-sm font-extrabold tracking-tight text-white">School ERP</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-400">Institutional Workspace</p>
              </div>
            </div>

            <div className="mt-16 max-w-md">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-bold text-sky-300">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Modern Academic Platform
              </span>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white xl:text-5xl">
                Run the school with precision.
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
                Unified administration for students, attendance, fees, exams, and family communication across all departments.
              </p>
            </div>

            <div className="mt-8 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" aria-hidden="true" />
                <span>Multi-tenant isolation and cryptographic session tokens</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" aria-hidden="true" />
                <span>Fast attendance capture and real-time fee tracking</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" aria-hidden="true" />
                <span>Dedicated portals for Teachers, Students, and Parents</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 pt-8 text-xs text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 text-sky-400" aria-hidden="true" />
              <p className="mt-2.5 font-bold text-white">Protected Access</p>
              <p className="mt-1 leading-5 text-slate-400">Strict role and tenant boundaries enforced at every layer.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <Building2 className="h-5 w-5 text-sky-400" aria-hidden="true" />
              <p className="mt-2.5 font-bold text-white">High Reliability</p>
              <p className="mt-1 leading-5 text-slate-400">Engineered for daily academic workflows and peak operations.</p>
            </div>
          </div>
        </section>

        <section className="flex min-w-0 items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 font-black text-white shadow-md shadow-sky-600/20">
                  S
                </div>
                <div>
                  <h1 className="text-base font-black tracking-tight text-slate-950">School ERP</h1>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600">Institutional Workspace</p>
                </div>
              </div>
            </div>
            <Suspense fallback={<PageLoader className="min-h-[240px]" />}>
              <Outlet />
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}
