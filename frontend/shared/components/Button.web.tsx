import type { CSSProperties } from "react";
import React from "react";

import { radius, spacing, typography } from "../tokens";
import { buttonHeightMap, webButtonStyles } from "./helpers";
import type { ButtonProps } from "./types";

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon
}: ButtonProps) {
  const style: CSSProperties = {
    ...webButtonStyles(variant, disabled || loading),
    minHeight: buttonHeightMap[size],
    padding: `0 ${spacing[size === "sm" ? 3 : size === "md" ? 4 : 5]}px`,
    borderRadius: radius.full,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    fontFamily: typography.fontFamily.sans,
    fontWeight: Number(typography.fontWeight.semibold),
    fontSize: typography.fontSize.base
  };

  return (
    <button type="button" onClick={onPress} disabled={disabled || loading} style={style}>
      {loading ? <span aria-hidden="true">⏳</span> : icon}
      <span>{loading ? "Loading..." : label}</span>
    </button>
  );
}
