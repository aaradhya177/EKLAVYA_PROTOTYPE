import * as XLSX from "xlsx";

import {
  athletes,
  consentAudit,
  eligibleGrantAthletes,
  grants,
  lastMedicalChecks,
  performanceIndices,
  riskScores,
  sessions,
  sports,
  type ConsentAudit,
  type TalentBoardAthlete,
  type TalentBoardTier
} from "./mock-data";

export const classNames = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

export const getSportName = (sportId: number) => sports.find((sport) => sport.id === sportId)?.name ?? "Unknown";
export const getRiskForAthlete = (athleteId: string) => riskScores.find((risk) => risk.athlete_id === athleteId);
export const getPerformanceForAthlete = (athleteId: string) => performanceIndices.find((item) => item.athlete_id === athleteId);
export const getLastSessionForAthlete = (athleteId: string) =>
  sessions
    .filter((session) => session.athlete_id === athleteId)
    .sort((a, b) => (a.start_time < b.start_time ? 1 : -1))[0];

export const getAthleteAge = (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));

export const buildAthleteWorkbook = () => {
  const rows = athletes.map((athlete) => ({
    name: athlete.name,
    sport: getSportName(athlete.sport_id),
    tier: athlete.tier,
    state: athlete.state,
    current_risk: getRiskForAthlete(athlete.id)?.risk_level ?? "unknown",
    assigned_coach: lastMedicalChecks[athlete.id] ? `Coach for ${athlete.name.split(" ")[0]}` : "Unassigned",
    last_medical_check: lastMedicalChecks[athlete.id] ?? ""
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Athletes");
  return workbook;
};

export const grantEligibilityFilter = () => {
  const grantedAthleteIds = new Set(grants.map((grant) => grant.athlete_id));
  return eligibleGrantAthletes.filter((athlete) => !grantedAthleteIds.has(athlete.id));
};

export const moveTalentAthleteTier = (items: TalentBoardAthlete[], athleteId: string, nextTier: TalentBoardTier) =>
  items.map((item) => (item.athleteId === athleteId ? { ...item, tier: nextTier } : item));

export const complianceSummary = (records: ConsentAudit[]) => {
  const athleteIds = [...new Set(records.map((record) => record.athleteId))];
  const byAthlete = athleteIds.map((athleteId) => records.filter((record) => record.athleteId === athleteId));
  const full = byAthlete.filter((items) => items.length >= 3 && items.every((item) => item.consented && !item.revokedDate)).length;
  const partial = byAthlete.filter((items) => items.some((item) => item.consented) && items.length < 3).length;
  const revokedFinancial = byAthlete.filter((items) => items.some((item) => item.dataCategory === "financial" && Boolean(item.revokedDate))).length;
  const noConsent = athletes.filter((athlete) => !records.some((record) => record.athleteId === athlete.id)).length;
  return {
    fullPercent: athleteIds.length === 0 ? 0 : Math.round((full / athleteIds.length) * 100),
    partialPercent: athleteIds.length === 0 ? 0 : Math.round((partial / athleteIds.length) * 100),
    revokedFinancialPercent: athleteIds.length === 0 ? 0 : Math.round((revokedFinancial / athleteIds.length) * 100),
    noConsent
  };
};

export const countRevokedConsent = (records: ConsentAudit[]) => records.filter((record) => Boolean(record.revokedDate)).length;

export const athleteDensityByState = () =>
  athletes.reduce<Record<string, number>>((acc, athlete) => {
    acc[athlete.state] = (acc[athlete.state] ?? 0) + 1;
    return acc;
  }, {});

