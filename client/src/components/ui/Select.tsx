import { forwardRef, useId, SelectHTMLAttributes } from "react";
import { cn } from "../../utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, label, error, hint, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;
    const describedBy = [error ? errorId : null, hint && !error ? hintId : null].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && <label htmlFor={selectId} className="label">{label}</label>}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "input cursor-pointer appearance-none pr-10",
            "bg-[linear-gradient(45deg,transparent_50%,#64748b_50%),linear-gradient(135deg,#64748b_50%,transparent_50%)] bg-[position:calc(100%-18px)_18px,calc(100%-13px)_18px] bg-[length:5px_5px,5px_5px] bg-no-repeat",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {hint && !error && <p id={hintId} className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>}
        {error && <p id={errorId} role="alert" className="mt-1.5 text-sm leading-5 text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
