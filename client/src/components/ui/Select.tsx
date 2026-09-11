import { forwardRef, type SelectHTMLAttributes, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, containerClassName, children, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;
    const describedBy = [error ? errorId : null, hint && !error ? hintId : null].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && <label htmlFor={selectId} className="label">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "input cursor-pointer appearance-none pr-10",
              error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
        </div>
        {hint && !error && <p id={hintId} className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>}
        {error && <p id={errorId} role="alert" className="mt-1.5 text-sm leading-5 text-rose-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
