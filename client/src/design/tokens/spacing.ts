export const spacing = {
  // Border radius - more refined
  radius: {
    none: "0",
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },
  // Premium shadows with color
  shadow: {
    sm: "0 1px 2px 0 rgb(15 23 42 / 0.05)",
    md: "0 4px 6px -1px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)",
    lg: "0 10px 15px -3px rgb(15 23 42 / 0.08), 0 4px 6px -4px rgb(15 23 42 / 0.05)",
    xl: "0 20px 25px -5px rgb(15 23 42 / 0.1), 0 8px 10px -6px rgb(15 23 42 / 0.05)",
    // Glow shadows for premium elements
    glow: "0 0 40px -10px rgb(59 130 246 / 0.3)",
    glowViolet: "0 0 40px -10px rgb(139 92 246 / 0.3)",
    glowEmerald: "0 0 40px -10px rgb(16 185 129 / 0.3)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  },
  // Transitions - springy and smooth
  transition: {
    instant: "50ms cubic-bezier(0.4, 0, 0.2, 1)",
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "250ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "350ms cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
    springSlow: "600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;
