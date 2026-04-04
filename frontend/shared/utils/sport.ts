import { colors } from "../tokens";

const sportIconMap: Record<string, string> = {
  athletics: "🏃",
  badminton: "🏸",
  boxing: "🥊",
  football: "⚽",
  hockey: "🏑",
  kabaddi: "🤼",
  shooting: "🎯",
  swimming: "🏊",
  weightlifting: "🏋️"
};

const sportColorMap: Record<string, string> = {
  athletics: colors.primary[600],
  badminton: colors.teal[400],
  boxing: colors.coral[400],
  football: colors.green[400],
  hockey: colors.primary[800],
  kabaddi: colors.amber[400],
  shooting: colors.gray[800],
  swimming: colors.teal[600],
  weightlifting: colors.red[400]
};

export const getSportIcon = (sportName: string): string => sportIconMap[sportName.toLowerCase()] ?? "🏅";

export const getSportColor = (sportName: string): string =>
  sportColorMap[sportName.toLowerCase()] ?? colors.primary[400];
