import { createContext, useContext, useId, KeyboardEvent, ReactNode } from "react";
import { cn } from "../../utils";

interface TabsContextValue { value: string; onValueChange: (value: string) => void; baseId: string; }
const TabsContext = createContext<TabsContextValue | null>(null);
function toSlug(value: string) { return value.replace(/[^a-zA-Z0-9_-]/g, "-"); }

interface TabsProps { children: ReactNode; value: string; onValueChange: (value: string) => void; defaultValue?: string; className?: string; }
export function Tabs({ children, value, onValueChange, className }: TabsProps) {
  const baseId = useId();
  return <TabsContext.Provider value={{ value, onValueChange, baseId }}><div className={cn("space-y-4", className)}>{children}</div></TabsContext.Provider>;
}
interface TabsListProps { children: ReactNode; className?: string; }
export function TabsList({ children, className }: TabsListProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'));
    if (tabs.length === 0) return;
    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else nextIndex = tabs.length - 1;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    nextTab?.focus();
    nextTab?.click();
  };
  return <div role="tablist" onKeyDown={handleKeyDown} className={cn("flex gap-1 bg-gray-100 p-1 rounded-lg", className)}>{children}</div>;
}
interface TabsTriggerProps { value: string; children: ReactNode; className?: string; disabled?: boolean; }
export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const context = useContext(TabsContext); const isActive = context?.value === value; const slug = toSlug(value);
  return <button type="button" role="tab" id={context ? `${context.baseId}-tab-${slug}` : undefined} aria-selected={isActive} aria-controls={context ? `${context.baseId}-panel-${slug}` : undefined} tabIndex={context ? (isActive ? 0 : -1) : undefined} disabled={disabled} onClick={() => context?.onValueChange(value)} className={cn("inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors", "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500", "disabled:opacity-50 disabled:cursor-not-allowed", isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900", className)}>{children}</button>;
}
interface TabsContentProps { value: string; children: ReactNode; className?: string; }
export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = useContext(TabsContext); if (context && context.value !== value) return null; const slug = toSlug(value);
  return <div role="tabpanel" id={context ? `${context.baseId}-panel-${slug}` : undefined} aria-labelledby={context ? `${context.baseId}-tab-${slug}` : undefined} className={cn("mt-2 focus:outline-none", className)}>{children}</div>;
}
