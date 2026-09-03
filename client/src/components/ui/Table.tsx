import { KeyboardEvent, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function Table<T>({ data, columns, keyExtractor, onRowClick, className, emptyMessage = "No data available", isLoading = false }: TableProps<T>) {
  if (isLoading && data.length === 0) {
    return <div role="status" className="flex items-center justify-center gap-2 py-8 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="text-sm">Loading...</span></div>;
  }
  if (data.length === 0) return <div className="text-center py-8 text-gray-500">{emptyMessage}</div>;

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, item: T) => {
    if (!onRowClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(item);
    }
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead><tr className="border-b border-gray-200 bg-gray-50">{columns.map((col) => <th key={col.key} scope="col" className={cn("px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", col.className)}>{col.header}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item) => <tr key={keyExtractor(item)} tabIndex={onRowClick ? 0 : undefined} onKeyDown={(event) => handleRowKeyDown(event, item)} className={cn("hover:bg-gray-50 transition-colors", onRowClick && "cursor-pointer focus:outline-none focus-visible:bg-primary-50")} onClick={() => onRowClick?.(item)}>{columns.map((col) => <td key={col.key} className={cn("px-4 py-3 text-sm text-gray-900", col.className)}>{col.render ? col.render(item) : ((item as Record<string, unknown>)[col.key] as ReactNode)}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
