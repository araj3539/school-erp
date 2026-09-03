import { Loader2 } from "lucide-react";
import { cn } from "../../utils";

interface SpinnerProps { className?: string; label?: string; }
export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return <span role="status" aria-label={label} className="inline-flex"><Loader2 className={cn("h-5 w-5 animate-spin text-primary-600", className)} aria-hidden="true" /></span>;
}

interface PageLoaderProps { label?: string; fullScreen?: boolean; className?: string; }
export function PageLoader({ label = "Loading...", fullScreen = false, className }: PageLoaderProps) {
  return <div role="status" aria-live="polite" className={cn("flex w-full items-center justify-center", fullScreen ? "min-h-screen bg-gray-50" : "min-h-[50vh]", className)}>
    <div className="flex flex-col items-center gap-3 text-gray-500"><Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden="true" /><span className="text-sm">{label}</span></div>
  </div>;
}
