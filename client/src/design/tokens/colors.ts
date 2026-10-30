export const colors = {
  // Brand / primary - rich blue gradient family
  primary: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
    // Gradient stops for premium look
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    gradientMesh:
      "radial-gradient(at 0% 0%, hsla(213,89%,65%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,89%,65%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(231,89%,65%,1) 0, transparent 50%)",
  },
  // Accent colors for variety
  accent: {
    violet: {
      500: "#8b5cf6",
      600: "#7c3aed",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    },
    emerald: {
      500: "#10b981",
      600: "#059669",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
    amber: {
      500: "#f59e0b",
      600: "#d97706",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    },
    rose: {
      500: "#f43f5e",
      600: "#e11d48",
      gradient: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
    },
    cyan: {
      500: "#06b6d4",
      600: "#0891b2",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    },
  },
  // Neutral slate - deeper for dark mode feel
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  // Glassmorphism backgrounds
  glass: {
    light: "rgba(255, 255, 255, 0.7)",
    medium: "rgba(255, 255, 255, 0.5)",
    dark: "rgba(15, 23, 42, 0.3)",
    border: "rgba(255, 255, 255, 0.2)",
    borderDark: "rgba(255, 255, 255, 0.1)",
  },
  // Semantic
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    500: "#22c55e",
    600: "#16a34a",
    gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    500: "#eab308",
    600: "#ca8a04",
    gradient: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
  },
  danger: {
    50: "#fef2f2",
    100: "#fee2e2",
    500: "#ef4444",
    600: "#dc2626",
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  },
  info: {
    50: "#eff6ff",
    100: "#dbeafe",
    500: "#3b82f6",
    600: "#2563eb",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  },
} as const;

export type ColorScale = keyof typeof colors.primary;
export type SemanticColor = "success" | "warning" | "danger" | "info";
