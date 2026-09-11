import { useEffect, useState } from "react";
import { Command, Search, Plus, LayoutDashboard, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const shortcuts = [
  { keys: "G then D", label: "Dashboard", icon: LayoutDashboard },
  { keys: "G then S", label: "Students", icon: Users },
  { keys: "/", label: "Focus search", icon: Search },
  { keys: "N", label: "New admission", icon: Plus },
];

export function KeyboardShortcutHud({ onFocusSearch }: { onFocusSearch?: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [sequence, setSequence] = useState("");

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.matches("input, textarea, select, [contenteditable='true']");
      if (event.key === "?" && !typing) { event.preventDefault(); setOpen((current) => !current); return; }
      if (event.key === "Escape") { setOpen(false); setSequence(""); return; }
      if (typing && event.key !== "/") return;
      if (event.key === "/") {
        event.preventDefault();
        const search = document.querySelector<HTMLInputElement>("input[aria-label*='search' i], input[placeholder*='search' i]");
        search?.focus();
        onFocusSearch?.();
        return;
      }
      if (event.key.toLowerCase() === "g") { setSequence("g"); return; }
      if (sequence === "g" && event.key.toLowerCase() === "d") { navigate("/dashboard"); setSequence(""); return; }
      if (sequence === "g" && event.key.toLowerCase() === "s") { navigate("/students"); setSequence(""); return; }
      if (event.key.toLowerCase() === "n") { navigate("/students"); setSequence(""); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [navigate, onFocusSearch, sequence]);

  return <>
    <button type="button" onClick={() => setOpen(true)} className="shortcut-trigger focus-ring" aria-label="Show keyboard shortcuts"><Command className="h-3.5 w-3.5" aria-hidden="true" /><span>?</span></button>
    {open && <div className="shortcut-overlay" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <div className="shortcut-panel">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4"><div><p className="eyebrow">Keyboard HUD</p><h2 className="mt-1 text-lg font-bold text-slate-950">Power shortcuts</h2></div><button type="button" onClick={() => setOpen(false)} className="focus-ring rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Close shortcuts"><X className="h-4 w-4" /></button></div>
        <div className="grid gap-2 p-4">{shortcuts.map(({ keys, label, icon: Icon }) => <div key={keys} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3"><Icon className="h-4 w-4 text-primary-600" /><span className="flex-1 text-sm font-semibold text-slate-700">{label}</span><kbd>{keys}</kbd></div>)}</div>
      </div>
    </div>}
  </>;
}
