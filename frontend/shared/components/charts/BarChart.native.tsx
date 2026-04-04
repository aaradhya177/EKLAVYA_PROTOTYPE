import React from "react";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryTheme } from "victory-native";

import { colors } from "../../tokens";
import type { BarChartProps } from "./types";

export function BarChart<T extends Record<string, string | number>>({
  data,
  xKey,
  yKey,
  color = colors.teal[400]
}: BarChartProps<T>) {
  return (
    <VictoryChart theme={VictoryTheme.material} domainPadding={16}>
      <VictoryAxis />
      <VictoryAxis dependentAxis />
      <VictoryBar data={data} x={xKey} y={yKey} style={{ data: { fill: color } }} cornerRadius={{ top: 6 }} />
    </VictoryChart>
  );
}
