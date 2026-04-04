import React from "react";
import { VictoryAxis, VictoryChart, VictoryLine, VictoryScatter, VictoryTheme } from "victory-native";

import { colors } from "../../tokens";
import type { LineChartProps } from "./types";

export function LineChart<T extends Record<string, string | number>>({
  data,
  xKey,
  yKey,
  color = colors.primary[600],
  showDots = false
}: LineChartProps<T>) {
  return (
    <VictoryChart theme={VictoryTheme.material}>
      <VictoryAxis />
      <VictoryAxis dependentAxis />
      <VictoryLine data={data} x={xKey} y={yKey} style={{ data: { stroke: color, strokeWidth: 3 } }} />
      {showDots ? <VictoryScatter data={data} x={xKey} y={yKey} size={3} style={{ data: { fill: color } }} /> : null}
    </VictoryChart>
  );
}
