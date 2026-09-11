import { KeyboardEvent, ReactNode, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils";

interface Column<T> { key: string; header: string; render?: (item: T) => ReactNode; className?: string; }
interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  onContextMenu?: (event: React.MouseEvent<HTMLTableRowElement>, item: T) => void;
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  className?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  virtualize?: boolean;
  virtualHeight?: number;
  rowHeight?: number;
}

export function Table<T>({ data, columns, keyExtractor, onRowClick, onContextMenu, selectable = false, selectedKeys = [], onSelectionChange, className, emptyMessage = "No data available", isLoading = false, virtualize = false, virtualHeight = 560, rowHeight = 56 }: TableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const selection = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  if (isLoading && data.length === 0) return <div role="status" className="flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 py-10 text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-primary-600" aria-hidden="true" /><span className="text-sm font-medium">Loading data...</span></div>;
  if (data.length === 0) return <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-10 text-center"><div><p className="text-sm font-semibold text-slate-800">Nothing to show yet</p><p className="mt-1 text-sm text-slate-500">{emptyMessage}</p></div></div>;

  const select = (item: T) => {
    const key = keyExtractor(item);
    const next = new Set(selection);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange?.([...next]);
  };
  const allSelected = selectable && data.length > 0 && data.every((item) => selection.has(keyExtractor(item)));
  const toggleAll = () => onSelectionChange?.(allSelected ? [] : data.map(keyExtractor));
  const visibleData = virtualize ? (() => { const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 8); const end = Math.min(data.length, Math.ceil((scrollTop + virtualHeight) / rowHeight) + 8); return { start, items: data.slice(start, end) }; })() : { start: 0, items: data };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, item: T) => { if (!onRowClick) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onRowClick(item); } };
  const renderRows = () => visibleData.items.map((item, index) => {
    const key = keyExtractor(item);
    return <tr key={key} tabIndex={onRowClick ? 0 : undefined} onKeyDown={(event) => handleRowKeyDown(event, item)} onClick={() => onRowClick?.(item)} onContextMenu={(event) => onContextMenu?.(event, item)} className={cn("transition-colors duration-100 hover:bg-slate-50/80", selection.has(key) && "bg-primary-50/60", onRowClick && "cursor-pointer focus:bg-primary-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500")} style={virtualize ? { position: "absolute", top: (visibleData.start + index) * rowHeight, left: 0, right: 0, height: rowHeight } : undefined}>
      {selectable && <td className="w-12 px-3 text-center"><input type="checkbox" aria-label={`Select row ${key}`} checked={selection.has(key)} onChange={(event) => { event.stopPropagation(); select(item); }} onClick={(event) => event.stopPropagation()} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" /></td>}
      {columns.map((col) => <td key={col.key} className={cn("px-4 py-3.5 text-sm text-slate-700 sm:px-5", col.className)}>{col.render ? col.render(item) : ((item as Record<string, unknown>)[col.key] as ReactNode)}</td>)}
    </tr>;
  });

  return <div className={cn("overflow-hidden rounded-2xl border border-slate-200/80", className)}>
    <div ref={scrollRef} className={cn("overflow-x-auto", virtualize && "overflow-y-auto")} style={virtualize ? { maxHeight: virtualHeight } : undefined} onScroll={virtualize ? (event) => setScrollTop(event.currentTarget.scrollTop) : undefined}>
      <table className="w-full min-w-full">
        <thead className="sticky top-0 z-10"><tr className="border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm">{selectable && <th scope="col" className="w-12 px-3 text-center"><input type="checkbox" aria-label="Select all rows" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" /></th>}{columns.map((col) => <th key={col.key} scope="col" className={cn("whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:px-5", col.className)}>{col.header}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100 bg-white" style={virtualize ? { position: "relative", display: "block", height: data.length * rowHeight } : undefined}>{renderRows()}</tbody>
      </table>
    </div>
  </div>;
}
