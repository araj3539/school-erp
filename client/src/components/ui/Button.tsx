import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const baseStyles =
  "inline-flex min-h-10 items-center justify-center rounded-xl font-semibold tracking-[-0.01em] transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 select-none";

const variants = {
  primary: "bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-950",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300",
  danger: "bg-rose-600 text-white shadow-sm shadow-rose-600/15 hover:bg-rose-700 active:bg-rose-800",
  outline: "border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200"
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, loading = false, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
