import { AlertCircle } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../utils";

interface ErrorStateProps { message?: string; onRetry?: () => void; className?: string; }
export function ErrorState({ message = "Something went wrong.", onRetry, className }: ErrorStateProps) {
  return <div role="alert" className={cn("rounded-2xl border border-red-100 bg-red-50/60 px-5 py-10 text-center", className)}>
    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm ring-1 ring-red-100">
      <AlertCircle className="h-5 w-5" aria-hidden="true" />
    </div>
    <p className="mt-4 font-semibold text-red-800">{message}</p>
    {onRetry && <Button type="button" className="mt-4" variant="outline" onClick={onRetry}>Try Again</Button>}
  </div>;
}
