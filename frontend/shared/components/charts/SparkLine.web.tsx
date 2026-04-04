import React from "react";

import { colors } from "../../tokens";
import type { SparkLineProps } from "./types";

export function SparkLine({ data, color = colors.primary[600], width = 120, height = 32 }: SparkLineProps) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((value, index) => `${(index / Math.max(data.length - 1, 1)) * width},${height - ((value - min) / range) * height}`)
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sparkline">
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} />
    </svg>
  );
}
