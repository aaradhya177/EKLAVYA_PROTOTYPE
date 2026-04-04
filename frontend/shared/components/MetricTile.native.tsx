import React from "react";
import { Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../tokens";
import { getTrendGlyph } from "./helpers";
import type { MetricTileProps } from "./types";

export function MetricTile({ label, value, unit, trend, trendValue, color = colors.primary[600] }: MetricTileProps) {
  return (
    <View
      style={{
        padding: spacing[4],
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.gray[100],
        backgroundColor: colors.white
      }}
    >
      <Text style={{ color: colors.gray[600], fontSize: typography.fontSize.sm }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing[2], marginTop: spacing[2] }}>
        <Text style={{ color, fontSize: typography.fontSize["3xl"], fontWeight: typography.fontWeight.bold }}>{value}</Text>
        {unit ? <Text style={{ color: colors.gray[600] }}>{unit}</Text> : null}
      </View>
      {trend ? (
        <Text style={{ marginTop: spacing[2], color: trend === "down" ? colors.red[400] : colors.teal[400] }}>
          {getTrendGlyph(trend)} {trendValue ?? "Stable"}
        </Text>
      ) : null}
    </View>
  );
}
