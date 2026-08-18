import { Fragment, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <Fragment>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={cn(
            "my-auto flex w-full min-w-0 max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-lg bg-white shadow-xl",
            sizes[size]
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
            <h3 id="modal-title" className="min-w-0 truncate text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  );
}
