import React from "react";
import { useId, InputHTMLAttributes } from "react";
import { cn } from "../../utils";

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, hint, required, children, className }: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint && !error ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
          {label} {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative" id={id}>
        {React.cloneElement(children as React.ReactElement, {
          id,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy,
          "aria-labelledby": label,
        } as any)}
      </div>
      {hint && !error && <p id={hintId} className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function FormFieldInput(props: FormFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FormField label={props.label} error={props.error} hint={props.hint} required={props.required} className={props.className}>
      <input
        {...props}
        className={cn(
          "input block w-full",
          props.error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          props.className
        )}
      />
    </FormField>
  );
}

FormFieldInput.displayName = "FormFieldInput";
