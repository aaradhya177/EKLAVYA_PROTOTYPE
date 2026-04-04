import React from "react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { colors } from "../../tokens";
import type { BarChartProps } from "./types";

export function BarChart<T extends Record<string, string | number>>({
  data,
  xKey,
  yKey,
  color = colors.teal[400]
}: BarChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RechartsBarChart data={data}>
        <CartesianGrid stroke={colors.gray[100]} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Bar dataKey={yKey} fill={color} radius={[8, 8, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
