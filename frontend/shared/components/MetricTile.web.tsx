import React from "react";

import { colors, radius, spacing } from "../tokens";
import { getTrendGlyph } from "./helpers";
import type { MetricTileProps } from "./types";

export function MetricTile({ label, value, unit, trend, trendValue, color = colors.primary[600] }: MetricTileProps) {
  return (
    <div
      style={{
        padding: spacing[4],
        borderRadius: radius.lg,
        border: `1px solid ${colors.gray[100]}`,
        background: colors.white
      }}
    >
      <p style={{ margin: 0, fontSize: 13, color: colors.gray[600] }}>{label}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: spacing[2], marginTop: spacing[2] }}>
        <strong style={{ color, fontSize: 30 }}>{value}</strong>
        {unit ? <span style={{ color: colors.gray[600] }}>{unit}</span> : null}
      </div>
      {trend ? (
        <p style={{ margin: `${spacing[2]}px 0 0`, color: trend === "down" ? colors.red[400] : colors.teal[400] }}>
          {getTrendGlyph(trend)} {trendValue ?? "Stable"}
        </p>
      ) : null}
    </div>
  );
}
