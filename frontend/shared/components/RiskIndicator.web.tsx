import React from "react";

import { colors } from "../tokens";
import { getRiskPalette } from "./helpers";
import type { RiskIndicatorProps } from "./types";

export function RiskIndicator({ level, score, showLabel = true }: RiskIndicatorProps) {
  const palette = getRiskPalette(level);
  const clamped = Math.max(0, Math.min(1, score));
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - clamped);

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width="108" height="108" viewBox="0 0 108 108" role="img" aria-label={`${palette.label} risk`}>
        <circle cx="54" cy="54" r="42" stroke={colors.gray[100]} strokeWidth="10" fill="none" />
        <circle
          cx="54"
          cy="54"
          r="42"
          stroke={palette.color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 54 54)"
        />
        <text x="54" y="58" textAnchor="middle" fill={colors.gray[900]} fontSize="18" fontWeight="700">
          {Math.round(clamped * 100)}
        </text>
      </svg>
      {showLabel ? <span style={{ color: palette.color, fontWeight: 700 }}>{palette.label}</span> : null}
    </div>
  );
}
