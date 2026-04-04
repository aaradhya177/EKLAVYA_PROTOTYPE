import type { CSSProperties } from "react";

import { colors, nativeShadows, radius, spacing, typography, webShadows } from "../tokens";
import type { BadgeVariant, ButtonVariant, CardVariant, ComponentSize, RiskLevel, ToastVariant, TrendDirection } from "./types";

export const sizePaddingMap: Record<ComponentSize, number> = {
  sm: spacing[2],
  md: spacing[4],
  lg: spacing[5]
};

export const buttonHeightMap: Record<ComponentSize, number> = {
  sm: 36,
  md: 44,
  lg: 52
};

export const badgeVariantStyles: Record<BadgeVariant, { background: string; color: string }> = {
  success: { background: colors.green[50], color: colors.green[600] },
  warning: { background: colors.amber[50], color: colors.amber[600] },
  danger: { background: colors.red[50], color: colors.red[600] },
  info: { background: colors.primary[50], color: colors.primary[800] },
  neutral: { background: colors.gray[100], color: colors.gray[800] }
};

export const toastVariantStyles: Record<ToastVariant, { background: string; color: string }> = {
  success: { background: colors.green[50], color: colors.green[600] },
  error: { background: colors.red[50], color: colors.red[600] },
  warning: { background: colors.amber[50], color: colors.amber[600] },
  info: { background: colors.primary[50], color: colors.primary[800] }
};

export const webButtonStyles = (variant: ButtonVariant, disabled: boolean): CSSProperties => {
  const palette: Record<ButtonVariant, CSSProperties> = {
    primary: { background: colors.primary[600], color: colors.white, border: `1px solid ${colors.primary[600]}` },
    secondary: { background: colors.white, color: colors.primary[800], border: `1px solid ${colors.primary[200]}` },
    ghost: { background: "transparent", color: colors.gray[800], border: "1px solid transparent" },
    danger: { background: colors.red[400], color: colors.white, border: `1px solid ${colors.red[400]}` }
  };

  return {
    ...palette[variant],
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "pointer"
  };
};

export const webCardStyles = (variant: CardVariant): CSSProperties => {
  if (variant === "outlined") {
    return { background: colors.white, border: `1px solid ${colors.gray[200]}` };
  }
  if (variant === "elevated") {
    return { background: colors.white, border: `1px solid ${colors.gray[100]}`, boxShadow: webShadows.md };
  }
  return { background: colors.gray[50], border: `1px solid ${colors.gray[100]}` };
};

export const nativeCardShadow = (variant: CardVariant) => {
  if (variant === "elevated") {
    return nativeShadows.md;
  }
  if (variant === "default") {
    return nativeShadows.sm;
  }
  return {};
};

export const getTrendGlyph = (trend?: TrendDirection): string => {
  if (trend === "up") {
    return "↑";
  }
  if (trend === "down") {
    return "↓";
  }
  return "•";
};

export const getRiskPalette = (level: RiskLevel) => {
  const palette: Record<RiskLevel, { color: string; label: string; background: string }> = {
    low: { color: colors.green[400], label: "Low", background: colors.green[50] },
    medium: { color: colors.amber[400], label: "Medium", background: colors.amber[50] },
    high: { color: colors.coral[400], label: "High", background: colors.coral[50] },
    critical: { color: colors.red[400], label: "Critical", background: colors.red[50] }
  };
  return palette[level];
};

export const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

export const sharedFontStyles: CSSProperties = {
  fontFamily: typography.fontFamily.sans,
  borderRadius: radius.lg
};
