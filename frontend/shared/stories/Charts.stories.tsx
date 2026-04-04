import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { BarChart, GaugeChart, LineChart, RadarChart, SparkLine } from "../components/charts/index.web";
import { colors } from "../tokens";

const trendData = [
  { day: "Mon", load: 48, score: 0.42 },
  { day: "Tue", load: 56, score: 0.5 },
  { day: "Wed", load: 61, score: 0.58 },
  { day: "Thu", load: 73, score: 0.66 },
  { day: "Fri", load: 69, score: 0.62 }
];

const radarData = [
  { metric: "Power", value: 78, fullMark: 100 },
  { metric: "Speed", value: 84, fullMark: 100 },
  { metric: "Mobility", value: 62, fullMark: 100 },
  { metric: "Recovery", value: 71, fullMark: 100 },
  { metric: "Skill", value: 88, fullMark: 100 }
];

const meta = {
  title: "Foundation/Charts"
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TrendCharts: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 24 }}>
      <LineChart data={trendData} xKey="day" yKey="score" label="Risk score" />
      <BarChart data={trendData} xKey="day" yKey="load" color={colors.teal[400]} />
      <RadarChart data={radarData} />
      <GaugeChart
        value={0.68}
        thresholds={[
          { value: 0.35, color: colors.green[400], label: "Low" },
          { value: 0.65, color: colors.amber[400], label: "Medium" },
          { value: 0.85, color: colors.coral[400], label: "High" },
          { value: 1, color: colors.red[400], label: "Critical" }
        ]}
      />
      <SparkLine data={[42, 47, 44, 53, 58, 62, 59]} />
    </div>
  )
};
