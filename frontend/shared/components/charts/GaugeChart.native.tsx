import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";

import { colors } from "../../tokens";
import type { GaugeChartProps } from "./types";

export function GaugeChart({ value, thresholds }: GaugeChartProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const active = thresholds.find((threshold) => clamped <= threshold.value) ?? thresholds[thresholds.length - 1];
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - clamped);

  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        <Circle cx={60} cy={60} r={42} stroke={colors.gray[100]} strokeWidth={12} fill="none" />
        <Circle
          cx={60}
          cy={60}
          r={42}
          stroke={active.color}
          strokeWidth={12}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          origin="60, 60"
          rotation={-90}
        />
        <SvgText x="60" y="65" textAnchor="middle" fill={colors.gray[900]} fontSize="18" fontWeight="700">
          {Math.round(clamped * 100)}%
        </SvgText>
      </Svg>
      <Text style={{ color: active.color, fontWeight: "700" }}>{active.label}</Text>
    </View>
  );
}
