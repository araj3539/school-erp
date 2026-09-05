export const mobileTheme = {
  colors: {
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#0f172a",
    textMuted: "#475569",
    textSubtle: "#64748b",
    border: "#e2e8f0",
    borderSubtle: "#f1f5f9",
    dangerBackground: "#fef2f2",
    dangerText: "#b91c1c",
    warningText: "#92400e",
    successBackground: "#ecfdf5",
    active: "#0f172a",
    activeText: "#ffffff",
    controlBackground: "#f1f5f9",
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 },
  radius: { sm: 8, md: 12, pill: 20 },
  typography: { body: 15, small: 12, title: 30, section: 18 },
  touchTarget: 44,
} as const;

export type MobileTheme = typeof mobileTheme;
