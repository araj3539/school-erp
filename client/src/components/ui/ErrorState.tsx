import { AlertCircle } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../utils";

interface ErrorStateProps { message?: string; onRetry?: () => void; className?: string; }
export function ErrorState({ message = "Something went wrong.", onRetry, className }: ErrorStateProps) {
  return <div role="alert" className={cn("py-12 text-center", className)}>
    <AlertCircle className="mx-auto h-10 w-10 text-red-300" aria-hidden="true" />
    <p className="mt-3 font-medium text-red-600">{message}</p>
    {onRetry && <Button type="button" className="mt-3" variant="outline" onClick={onRetry}>Try Again</Button>}
  </div>;
}
