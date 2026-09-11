import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "../../utils";
import type { Toast } from "../../store/uiStore";

interface ToasterProps { toasts: Toast[]; onClose: (id: string) => void; }

const icons = {
  success: <CheckCircle className="h-5 w-5 text-emerald-600" aria-hidden="true" />,
  error: <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />,
  info: <Info className="h-5 w-5 text-sky-600" aria-hidden="true" />,
};

const styles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  error: "border-red-200 bg-red-50 text-red-950",
  info: "border-sky-200 bg-sky-50 text-sky-950",
};

export function Toaster({ toasts, onClose }: ToasterProps) {
  return (
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-md flex-col gap-2 sm:w-auto sm:min-w-[320px]">
      {toasts.map((toast) => (
        <div key={toast.id} role={toast.type === "error" ? "alert" : "status"} className={cn("relative overflow-hidden pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_14px_36px_rgba(15,23,42,0.12)]", "animate-slide-in", styles[toast.type])}>
          <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
          <p className="flex-1 text-sm font-semibold leading-5">{toast.message}</p>
          {toast.action && <button type="button" onClick={() => { toast.action?.onClick(); onClose(toast.id); }} className="focus-ring shrink-0 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-white">{toast.action.label}</button>}
          <button type="button" onClick={() => onClose(toast.id)} aria-label="Dismiss notification" className="focus-ring shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-white/60 hover:text-slate-700">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          {toast.durationMs && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-current/15" style={{ animation: `toast-progress ${toast.durationMs}ms linear forwards` }} />}
        </div>
      ))}
    </div>
  );
}
