import { cn } from "../../utils";

interface TabsProps {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  defaultValue?: string;
  className?: string;
}
export function Tabs({ children, value, onValueChange, className }: TabsProps) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}
export function TabsList({ children, className }: TabsListProps) {
  return <div className={cn("flex gap-1 bg-gray-100 p-1 rounded-lg", className)}>{children}</div>;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}
export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const isActive = false;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      className={cn(
        "px-4 py-2 text-sm font-medium rounded-md transition-colors",
        isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}
export function TabsContent({ value, children, className }: TabsContentProps) {
  return <div className={cn("mt-2", className)}>{children}</div>;
}
