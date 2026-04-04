import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";

import { colors } from "../tokens";
import { getRiskPalette } from "./helpers";
import type { RiskIndicatorProps } from "./types";

export function RiskIndicator({ level, score, showLabel = true }: RiskIndicatorProps) {
  const palette = getRiskPalette(level);
  const clamped = Math.max(0, Math.min(1, score));
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - clamped);

  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <Svg width={108} height={108} viewBox="0 0 108 108">
        <Circle cx={54} cy={54} r={42} stroke={colors.gray[100]} strokeWidth={10} fill="none" />
        <Circle
          cx={54}
          cy={54}
          r={42}
          stroke={palette.color}
          strokeWidth={10}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          origin="54, 54"
          rotation={-90}
        />
        <SvgText x="54" y="58" textAnchor="middle" fill={colors.gray[900]} fontSize="18" fontWeight="700">
          {Math.round(clamped * 100)}
        </SvgText>
      </Svg>
      {showLabel ? <Text style={{ color: palette.color, fontWeight: "700" }}>{palette.label}</Text> : null}
    </View>
  );
}
