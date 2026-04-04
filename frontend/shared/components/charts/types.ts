export type ChartDatum = Record<string, string | number>;

export type LineChartProps<T extends ChartDatum = ChartDatum> = {
  data: T[];
  xKey: keyof T & string;
  yKey: keyof T & string;
  color?: string;
  label?: string;
  showDots?: boolean;
};

export type BarChartProps<T extends ChartDatum = ChartDatum> = {
  data: T[];
  xKey: keyof T & string;
  yKey: keyof T & string;
  color?: string;
};

export type RadarChartDatum = {
  metric: string;
  value: number;
  fullMark: number;
};

export type RadarChartProps = {
  data: RadarChartDatum[];
  color?: string;
};

export type GaugeThreshold = {
  value: number;
  color: string;
  label: string;
};

export type GaugeChartProps = {
  value: number;
  thresholds: GaugeThreshold[];
};

export type SparkLineProps = {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
};
