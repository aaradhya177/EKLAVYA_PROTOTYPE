import Papa from "papaparse";

import { athletes, riskScores, sessions, sports, type CoachAlert, type PlanBlock } from "./mock-data";

export const classNames = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

export const getSportName = (sportId: number) => sports.find((sport) => sport.id === sportId)?.name ?? "Unknown";

export const getRiskForAthlete = (athleteId: string) => riskScores.find((risk) => risk.athlete_id === athleteId);

export const getLastSessionForAthlete = (athleteId: string) =>
  sessions
    .filter((session) => session.athlete_id === athleteId)
    .sort((a, b) => (a.start_time < b.start_time ? 1 : -1))[0];

export const formatRosterCsv = () => {
  const rows = athletes.map((athlete) => {
    const risk = getRiskForAthlete(athlete.id);
    const lastSession = getLastSessionForAthlete(athlete.id);
    return {
      name: athlete.name,
      sport: getSportName(athlete.sport_id),
      tier: athlete.tier,
      state: athlete.state,
      current_risk: risk?.risk_level ?? "unknown",
      acwr: Number(lastSession?.computed_metrics.acwr ?? 0).toFixed(2),
      last_session: lastSession?.start_time ?? ""
    };
  });
  return Papa.unparse(rows);
};

export const filterAlerts = (items: CoachAlert[], criticalOnly: boolean) =>
  criticalOnly ? items.filter((item) => item.riskLevel === "critical") : items;

export const validatePlanOverlap = (blocks: PlanBlock[]) => {
  const ordered = [...blocks].sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  const overlaps: string[] = [];
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (new Date(previous.endDate).getTime() >= new Date(current.startDate).getTime()) {
      overlaps.push(current.id);
    }
  }
  return overlaps;
};

export const getAlertsSince = (items: CoachAlert[], lastChecked: string | null) => {
  if (!lastChecked) {
    return items;
  }
  return items.filter((item) => item.time > lastChecked);
};
