import React from "react";
import { CartesianGrid, Legend, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { colors } from "../../tokens";
import type { LineChartProps } from "./types";

export function LineChart<T extends Record<string, string | number>>({
  data,
  xKey,
  yKey,
  color = colors.primary[600],
  label,
  showDots = false
}: LineChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RechartsLineChart data={data}>
        <CartesianGrid stroke={colors.gray[100]} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        {label ? <Legend /> : null}
        <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={3} dot={showDots} name={label} />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
