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
    if (!tabs.length) return;
    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
    let nextIndex = currentIndex < 0 ? 0 : currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else nextIndex = tabs.length - 1;
    event.preventDefault();
    tabs[nextIndex]?.focus();
    tabs[nextIndex]?.click();
  };
  return <div role="tablist" aria-orientation="horizontal" onKeyDown={handleKeyDown} className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100/80 p-1", className)}>{children}</div>;
}

interface TabsTriggerProps { value: string; children: ReactNode; className?: string; disabled?: boolean; }
export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const context = useContext(TabsContext); const isActive = context?.value === value; const slug = toSlug(value);
  return <button type="button" role="tab" id={context ? `${context.baseId}-tab-${slug}` : undefined} aria-selected={isActive} aria-controls={context ? `${context.baseId}-panel-${slug}` : undefined} tabIndex={context ? (isActive ? 0 : -1) : undefined} disabled={disabled} onClick={() => context?.onValueChange(value)} className={cn("inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold transition duration-200", "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50", isActive ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:bg-white/60 hover:text-slate-900", className)}>{children}</button>;
}

interface TabsContentProps { value: string; children: ReactNode; className?: string; }
export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = useContext(TabsContext); if (context && context.value !== value) return null; const slug = toSlug(value);
  return <div role="tabpanel" id={context ? `${context.baseId}-panel-${slug}` : undefined} aria-labelledby={context ? `${context.baseId}-tab-${slug}` : undefined} tabIndex={0} className={cn("focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40", className)}>{children}</div>;
}
