import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { ReactNode } from "react";

export function MasterDetailDrawer({ open, title, subtitle, children, onClose }: { open: boolean; title: string; subtitle?: string; children: ReactNode; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  return <AnimatePresence>
    {open && <>
      <motion.button type="button" aria-label="Close detail panel" className="fixed inset-0 z-[65] bg-slate-950/20 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0.01 : 0.18 }} onClick={onClose} />
      <motion.aside role="dialog" aria-modal="true" aria-label={title} className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-xl flex-col border-l border-slate-200 bg-white/95 shadow-[-24px_0_80px_rgba(15,23,42,0.16)] backdrop-blur-xl" initial={reduceMotion ? { opacity: 0 } : { x: "100%" }} animate={reduceMotion ? { opacity: 1 } : { x: 0 }} exit={reduceMotion ? { opacity: 0 } : { x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 34 }}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6"><div className="min-w-0"><p className="eyebrow">Master detail</p><h2 className="mt-1 truncate text-xl font-extrabold tracking-tight text-slate-950">{title}</h2>{subtitle && <p className="mt-1 truncate text-sm text-slate-500">{subtitle}</p>}</div><button type="button" onClick={onClose} className="focus-ring rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Close detail panel"><X className="h-5 w-5" /></button></header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </motion.aside>
    </>}
  </AnimatePresence>;
}
