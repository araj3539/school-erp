import { forwardRef, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils";

export interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost" | "gradient";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  glow?: boolean;
}

const baseStyles =
  "inline-flex min-h-10 items-center justify-center rounded-2xl font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary:
    "bg-primary-600 text-white shadow-sm shadow-primary-600/25 hover:bg-primary-700 hover:shadow-primary-600/35 focus-visible:ring-primary-500",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-500",
  danger: "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 hover:shadow-red-600/30 focus-visible:ring-red-500",
  outline: "border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-slate-500",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-500",
  gradient:
    "bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 text-white shadow-sm shadow-primary-600/30 hover:shadow-primary-600/40 hover:from-primary-700 hover:via-primary-800 hover:to-primary-700 focus-visible:ring-primary-500",
};

const sizes = {
  sm: "px-3 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
};

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, loading = false, glow = false, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], glow && "shadow-glow", sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
);
PremiumButton.displayName = "PremiumButton";
