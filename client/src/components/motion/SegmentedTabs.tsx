import { motion } from "motion/react";
import { cn } from "../../utils";

export function SegmentedTabs({ items, value, onChange, className }: { items: Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void; className?: string }) {
  return <div role="tablist" className={cn("segmented-tabs", className)} style={{ "--tab-count": items.length } as React.CSSProperties}>
    {items.map((item) => <button key={item.value} type="button" role="tab" aria-selected={item.value === value} onClick={() => onChange(item.value)} className={cn("segmented-tabs__tab", item.value === value && "segmented-tabs__tab--active")}>
      {item.value === value && <motion.span layoutId="segmented-tabs-indicator" className="segmented-tabs__indicator" transition={{ type: "spring", stiffness: 400, damping: 35 }} aria-hidden="true" />}
      <span className="relative z-10">{item.label}</span>
    </button>)}
  </div>;
}
