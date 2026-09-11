import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from "react";
import { cn } from "../../utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  shortcut?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightElement, shortcut, containerClassName, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const describedBy = [error ? errorId : null, hint && !error ? hintId : null].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && <label htmlFor={inputId} className="label">{label}</label>}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400" aria-hidden="true">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "input transition-all duration-150",
              leftIcon && "pl-10",
              (rightElement || shortcut) && "pr-12",
              error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10",
              className
            )}
            {...props}
          />
          {shortcut && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-400 shadow-sm">
                {shortcut}
              </kbd>
            </div>
          )}
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>
        {hint && !error && <p id={hintId} className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>}
        {error && <p id={errorId} role="alert" className="mt-1.5 text-sm leading-5 text-rose-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
