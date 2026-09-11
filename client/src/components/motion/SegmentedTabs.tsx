import { cn } from "../../utils";

export function SegmentedTabs({ items, value, onChange, className }: { items: Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void; className?: string }) {
  const activeIndex = Math.max(0, items.findIndex((item) => item.value === value));
  const width = `${100 / Math.max(items.length, 1)}%`;

  return <div role="tablist" className={cn("segmented-tabs", className)} style={{ "--tab-count": items.length } as React.CSSProperties}>
    <span aria-hidden="true" className="segmented-tabs__indicator" style={{ width, transform: `translateX(${activeIndex * 100}%)` }} />
    {items.map((item) => <button key={item.value} type="button" role="tab" aria-selected={item.value === value} onClick={() => onChange(item.value)} className={cn("segmented-tabs__tab", item.value === value && "segmented-tabs__tab--active")}>
      {item.label}
    </button>)}
  </div>;
}
