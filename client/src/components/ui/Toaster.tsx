import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "../../utils";
import type { Toast } from "../../store/uiStore";

interface ToasterProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

const icons = {
  success: (
    <CheckCircle
      className="h-5 w-5 text-green-500"
      aria-hidden="true"
    />
  ),
  error: (
    <AlertCircle
      className="h-5 w-5 text-red-500"
      aria-hidden="true"
    />
  ),
  info: (
    <Info
      className="h-5 w-5 text-blue-500"
      aria-hidden="true"
    />
  ),
};

const styles = {
  success: "bg-green-50 border-green-200 text-green-900",
  error: "bg-red-50 border-red-200 text-red-900",
  info: "bg-blue-50 border-blue-200 text-blue-900",
};

export function Toaster({ toasts, onClose }: ToasterProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-md flex-col gap-2 sm:w-auto sm:min-w-[300px]"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg",
            "animate-slide-in",
            styles[toast.type],
          )}
        >
          {icons[toast.type]}
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            type="button"
            onClick={() => onClose(toast.id)}
            aria-label="Dismiss notification"
            className="rounded-md p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
