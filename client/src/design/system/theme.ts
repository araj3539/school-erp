import { colors } from "../tokens/colors.ts";
import { spacing } from "../tokens/spacing.ts";
import { typography } from "../tokens/typography.ts";
import { zIndex } from "../tokens/z-index.ts";

export const designTokens = {
  colors,
  spacing,
  typography,
  zIndex,
};

export type DesignTokens = typeof designTokens;

export const theme = {
  semantic: {
    primary: colors.primary[600],
    primaryHover: colors.primary[700],
    primaryActive: colors.primary[800],
    primaryLight: colors.primary[50],
    primaryBorder: colors.primary[200],
    surface: colors.slate[50],
    surfaceHover: colors.slate[100],
    border: colors.slate[200],
    borderHover: colors.slate[300],
    textPrimary: colors.slate[900],
    textSecondary: colors.slate[600],
    textMuted: colors.slate[400],
    textInverse: colors.slate[50],
    success: colors.success[600],
    successLight: colors.success[50],
    warning: colors.warning[600],
    warningLight: colors.warning[50],
    danger: colors.danger[600],
    dangerLight: colors.danger[50],
    info: colors.info[600],
    infoLight: colors.info[50],
  },
  radius: spacing.radius,
  shadow: spacing.shadow,
  transition: spacing.transition,
  zIndex,
} as const;

export type Theme = typeof theme;
