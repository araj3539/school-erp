import { cn } from "../../utils";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "info" | "warning" | "error" | "success";
}

const Icons: Record<string, React.ComponentType<any>> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle2,
};

export function EmptyState({ icon, title, description, action, className, variant = "info" }: EmptyStateProps) {
  const Icon = Icons[variant];
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-6", className)}>
      {icon ?? <Icon className="mb-4 h-10 w-10 text-slate-400" size={32} />}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-500 max-w-md">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
