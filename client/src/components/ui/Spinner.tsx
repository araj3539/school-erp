import { Loader2 } from "lucide-react";
import { cn } from "../../utils";

interface SpinnerProps { className?: string; label?: string; }
export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return <span role="status" aria-label={label} className="inline-flex"><Loader2 className={cn("h-5 w-5 animate-spin text-primary-600", className)} aria-hidden="true" /></span>;
}

interface PageLoaderProps { label?: string; fullScreen?: boolean; className?: string; }
export function PageLoader({ label = "Loading...", fullScreen = false, className }: PageLoaderProps) {
  return <div role="status" aria-live="polite" className={cn("flex w-full items-center justify-center px-5", fullScreen ? "min-h-[100dvh] bg-slate-50" : "min-h-[50vh]", className)}>
    <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /></div>
      <span className="mt-3 block text-sm font-medium text-slate-600">{label}</span>
    </div>
  </div>;
}
