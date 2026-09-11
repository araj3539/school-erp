import { create } from "zustand";

export type ToastType = "success" | "error" | "info";
export interface Toast { id: string; message: string; type: ToastType; action?: { label: string; onClick: () => void }; durationMs?: number; }
const TOAST_DURATION_MS = 5000;
let toastCounter = 0;
interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  addActionToast: (message: string, action: { label: string; onClick: () => void }, type?: ToastType, durationMs?: number) => void;
  removeToast: (id: string) => void;
}
export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toasts: [],
  addToast: (message, type = "info") => {
    toastCounter += 1;
    const id = `${Date.now()}-${toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type, durationMs: TOAST_DURATION_MS }] }));
    setTimeout(() => get().removeToast(id), TOAST_DURATION_MS);
  },
  addActionToast: (message, action, type = "info", durationMs = TOAST_DURATION_MS) => {
    toastCounter += 1;
    const id = `${Date.now()}-${toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type, action, durationMs }] }));
    setTimeout(() => get().removeToast(id), durationMs);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}));
