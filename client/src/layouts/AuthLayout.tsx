import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { PageLoader } from "../components/ui/Spinner";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { ShieldCheck, Sparkles } from "lucide-react";

export function AuthLayout() {
  useDocumentTitle();
  return (
    <div className="min-h-[100dvh] bg-slate-50 p-3 sm:p-5 lg:p-8">
      <main className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:min-h-[calc(100dvh-2.5rem)] lg:grid-cols-[0.9fr_1.1fr] lg:min-h-[calc(100dvh-4rem)]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10" aria-hidden="true" />
          <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full border border-white/10" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-sm font-extrabold text-white">S</div>
              <div><p className="text-sm font-extrabold tracking-tight">School ERP</p><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-300">Management workspace</p></div>
            </div>
            <div className="mt-20 max-w-md">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">One place for the school day</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-[-0.04em] xl:text-5xl">Run the school with clarity.</h1>
              <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">Students, attendance, fees and academics stay organised in one focused workspace.</p>
            </div>
          </div>
          <div className="relative grid grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><ShieldCheck className="h-5 w-5 text-sky-300" aria-hidden="true" /><p className="mt-3 font-semibold text-white">Protected access</p><p className="mt-1 leading-5">Role and school boundaries stay enforced.</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><Sparkles className="h-5 w-5 text-sky-300" aria-hidden="true" /><p className="mt-3 font-semibold text-white">Less busywork</p><p className="mt-1 leading-5">Designed around everyday school operations.</p></div>
          </div>
        </section>

        <section className="flex min-w-0 items-center justify-center p-5 sm:p-8 lg:p-12 xl:p-16">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-sm font-extrabold text-white">S</div><div><h1 className="text-base font-extrabold tracking-tight text-slate-950">School ERP</h1><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-600">Management workspace</p></div></div></div>
            <Suspense fallback={<PageLoader className="min-h-[240px]" />}><Outlet /></Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}
