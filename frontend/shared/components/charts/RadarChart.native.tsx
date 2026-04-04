import React from "react";
import { VictoryArea, VictoryChart, VictoryPolarAxis, VictoryTheme } from "victory-native";

import { colors } from "../../tokens";
import type { RadarChartProps } from "./types";

export function RadarChart({ data, color = colors.primary[600] }: RadarChartProps) {
  return (
    <VictoryChart polar theme={VictoryTheme.material} domain={{ y: [0, Math.max(...data.map((entry) => entry.fullMark), 1)] }}>
      <VictoryPolarAxis dependentAxis tickFormat={() => ""} />
      <VictoryPolarAxis tickFormat={(tick) => data[tick]?.metric ?? ""} />
      <VictoryArea
        data={data.map((item, index) => ({ x: index + 1, y: item.value }))}
        style={{ data: { fill: color, fillOpacity: 0.25, stroke: color, strokeWidth: 2 } }}
      />
    </VictoryChart>
  );
}
