import { cn } from "../../utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "success" | "warning" | "danger" | "info";
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = "default", className, dot = false }: BadgeProps) {
  const variants = {
    default: "border-slate-200 bg-slate-100 text-slate-700",
    secondary: "border-slate-200 bg-slate-50 text-slate-600",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-sky-200 bg-sky-50 text-sky-700"
  };
  const dotColors = {
    default: "bg-slate-400",
    secondary: "bg-slate-400",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-sky-500"
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-[-0.01em]", variants[variant], className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} aria-hidden="true" />}
      {children}
    </span>
  );
}
