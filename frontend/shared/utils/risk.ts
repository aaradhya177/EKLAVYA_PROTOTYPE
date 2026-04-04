import { colors } from "../tokens";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export const getRiskColor = (level: RiskLevel): string => {
  switch (level) {
    case "low":
      return colors.green[400];
    case "medium":
      return colors.amber[400];
    case "high":
      return colors.coral[400];
    case "critical":
      return colors.red[400];
  }
};

export const getRiskLabel = (score: number): "Low" | "Medium" | "High" | "Critical" => {
  if (score >= 0.85) {
    return "Critical";
  }
  if (score >= 0.65) {
    return "High";
  }
  if (score >= 0.35) {
    return "Medium";
  }
  return "Low";
};

export const getACWRStatus = (acwr: number): { label: string; color: string; message: string } => {
  if (acwr < 0.8) {
    return {
      label: "Underloaded",
      color: colors.amber[400],
      message: "Load is below the target band. Consider progressive ramp-up."
    };
  }
  if (acwr <= 1.3) {
    return {
      label: "Optimal",
      color: colors.teal[400],
      message: "Load is in the sweet spot for adaptation."
    };
  }
  if (acwr <= 1.5) {
    return {
      label: "Elevated",
      color: colors.coral[400],
      message: "Monitor fatigue and recovery closely."
    };
  }
  return {
    label: "High Risk",
    color: colors.red[400],
    message: "Acute load is too high relative to chronic load."
  };
};
