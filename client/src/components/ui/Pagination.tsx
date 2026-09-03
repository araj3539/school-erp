import { Button } from "./Button";
import { cn } from "../../utils";

interface PaginationProps { page: number; totalPages: number; total?: number; itemLabel?: string; onPageChange: (page: number) => void; className?: string; }
export function Pagination({ page, totalPages, total, itemLabel = "items", onPageChange, className }: PaginationProps) {
  if (!totalPages || totalPages <= 1) return null;
  return <div className={cn("mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between", className)}>
    <p className="text-sm text-gray-500">Page {page} of {totalPages}{typeof total === "number" && ` · ${total} ${itemLabel}`}</p>
    <nav aria-label="Pagination" className="flex gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>Previous</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>Next</Button>
    </nav>
  </div>;
}
