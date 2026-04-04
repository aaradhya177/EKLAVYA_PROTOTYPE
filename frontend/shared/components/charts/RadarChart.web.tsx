import React from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart as RechartsRadarChart, ResponsiveContainer } from "recharts";

import { colors } from "../../tokens";
import type { RadarChartProps } from "./types";

export function RadarChart({ data, color = colors.primary[600] }: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsRadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" />
        <PolarRadiusAxis />
        <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.3} />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
