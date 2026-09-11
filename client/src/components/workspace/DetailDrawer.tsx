import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

export function DetailDrawer({ open, title, eyebrow, children, onClose }: { open: boolean; title: string; eyebrow?: string; children: React.ReactNode; onClose: () => void }) {
  const reduced = useReducedMotion();
  return <AnimatePresence>
    {open && <>
      <motion.button type="button" aria-label="Close detail panel" className="fixed inset-0 z-[70] cursor-default bg-slate-950/20 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside aria-label={title} aria-modal="true" role="dialog" className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white/95 shadow-[-24px_0_70px_rgba(15,23,42,0.18)] backdrop-blur-xl" initial={reduced ? { opacity: 0 } : { x: "100%" }} animate={reduced ? { opacity: 1 } : { x: 0 }} exit={reduced ? { opacity: 0 } : { x: "100%" }} transition={{ type: "spring", stiffness: 360, damping: 34 }}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6"><div className="min-w-0"><p className="eyebrow">{eyebrow || "Inspector"}</p><h2 className="mt-1 truncate text-xl font-extrabold tracking-tight text-slate-950">{title}</h2></div><button type="button" onClick={onClose} className="focus-ring tactile rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Close detail panel"><X className="h-5 w-5" /></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </motion.aside>
    </>}
  </AnimatePresence>;
}
