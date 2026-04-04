import React from "react";

import { badgeVariantStyles } from "./helpers";
import type { BadgeProps } from "./types";

export function Badge({ label, variant = "neutral", size = "md" }: BadgeProps) {
  const palette = badgeVariantStyles[variant];
  const padding = size === "sm" ? "2px 8px" : size === "md" ? "4px 10px" : "6px 12px";
  const fontSize = size === "sm" ? 11 : size === "md" ? 13 : 15;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding,
        borderRadius: 9999,
        background: palette.background,
        color: palette.color,
        fontSize,
        fontWeight: 600
      }}
    >
      {label}
    </span>
  );
}
