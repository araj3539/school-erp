import { useEffect } from "react";
import { cn } from "../../utils";

export type ContextMenuItem = { label: string; onSelect: () => void; danger?: boolean; disabled?: boolean };
export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: ContextMenuItem[]; onClose: () => void }) {
  useEffect(() => { const close = () => onClose(); window.addEventListener("scroll", close, true); window.addEventListener("resize", close); return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); }; }, [onClose]);
  return <div role="menu" aria-label="Row actions" className="fixed z-[90] min-w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl" style={{ left: Math.min(x, window.innerWidth - 220), top: Math.min(y, window.innerHeight - items.length * 42 - 24) }} onMouseDown={(event) => event.stopPropagation()}>
    {items.map((item) => <button key={item.label} type="button" role="menuitem" disabled={item.disabled} onClick={() => { item.onSelect(); onClose(); }} className={cn("flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40", item.danger ? "text-red-700 hover:bg-red-50" : "text-slate-700")}>{item.label}</button>)}
  </div>;
}
