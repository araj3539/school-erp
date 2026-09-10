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
    return (
      <div role="status" className="flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 py-10 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-primary-600" aria-hidden="true" />
        <span className="text-sm font-medium">Loading data...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-10 text-center">
        <div>
          <p className="text-sm font-semibold text-slate-800">Nothing to show yet</p>
          <p className="mt-1 text-sm text-slate-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, item: T) => {
    if (!onRowClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(item);
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-slate-200/80", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map((col) => (
                <th key={col.key} scope="col" className={cn("whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:px-5", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(event) => handleRowKeyDown(event, item)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "transition-colors duration-100 hover:bg-slate-50/80",
                  onRowClick && "cursor-pointer focus:bg-primary-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3.5 text-sm text-slate-700 sm:px-5", col.className)}>
                    {col.render ? col.render(item) : ((item as Record<string, unknown>)[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
