import { cn } from "../../utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  gradient?: boolean;
}

export function PremiumCard({
  children,
  className,
  hover = true,
  glass = false,
  gradient = false,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-lift hover:-translate-y-1",
        hover && "group",
        glass && "bg-white/60 backdrop-blur-lg border-white/30",
        gradient &&
          "border-transparent bg-gradient-to-br from-white via-slate-50/50 to-slate-100/50",
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function PremiumCardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("border-b border-slate-100/50 bg-white/30 px-6 py-4", className)}>{children}</div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PremiumCardContent({ children, className }: CardContentProps) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function PremiumCardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn("border-t border-slate-100/50 bg-white/30 px-6 py-4", className)}>{children}</div>
  );
}
