import { cn } from "../../utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circle" | "rect" | "line";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = "text", width, height }: SkeletonProps) {
  const base = "animate-pulse rounded-md bg-slate-200";
  const variants: Record<string, string> = {
    text: "h-4 w-full",
    circle: "h-8 w-8 rounded-full",
    rect: "h-16 w-full",
    line: "h-4 w-full",
  };

  return (
    <div
      className={cn(base, variants[variant], className)}
      style={{ width, height }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function SkeletonText({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="text" className={i === count - 1 ? "w-2/3" : "w-full"} />
      ))}
    </div>
  );
}
