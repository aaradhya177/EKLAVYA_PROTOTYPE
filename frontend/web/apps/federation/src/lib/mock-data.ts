import type { Athlete, CareerGoal, GrantRecord, Notification, PerformanceIndex, RiskScore, SessionLog, Sport, TalentSignal } from "../../../../shared/types";

export type FederationProfile = {
  id: string;
  name: string;
  role: "federation_admin";
};

export type TalentBoardTier = "Emerging" | "State Level" | "National Contender" | "Elite" | "Olympic Potential";

export type TalentBoardAthlete = {
  athleteId: string;
  name: string;
  sport: string;
  tier: TalentBoardTier;
  topIndex: number;
  recentSignal: string;
  highlighted: boolean;
};

export type ConsentAudit = {
  id: string;
  athleteId: string;
  athleteName: string;
  dataCategory: "health" | "financial" | "performance";
  consented: boolean;
  date: string;
  revokedDate: string | null;
};

export type ReportJob = {
  id: string;
  name: string;
  format: "pdf" | "csv" | "excel";
  status: "pending" | "complete";
  createdAt: string;
  downloadUrl?: string;
};

export const federationProfile: FederationProfile = {
  id: "fed-1",
  name: "AFI Federation Admin",
  role: "federation_admin"
};

export const sports: Sport[] = [
  { id: 1, name: "Athletics", category: "individual", ontology_tags: {} },
  { id: 2, name: "Boxing", category: "individual", ontology_tags: {} },
  { id: 3, name: "Hockey", category: "team", ontology_tags: {} }
];

export const athletes: Athlete[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Aarohi Sharma",
    dob: "2004-08-10",
    gender: "female",
    sport_id: 1,
    state: "Haryana",
    tier: "elite",
    created_at: "2025-01-15T08:00:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Dev Malhotra",
    dob: "2003-02-11",
    gender: "male",
    sport_id: 1,
    state: "Punjab",
    tier: "national",
    created_at: "2025-01-12T08:00:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Ira Menon",
    dob: "2005-06-18",
    gender: "female",
    sport_id: 2,
    state: "Kerala",
    tier: "state",
    created_at: "2025-01-11T08:00:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "Samar Deshpande",
    dob: "2002-04-22",
    gender: "male",
    sport_id: 3,
    state: "Maharashtra",
    tier: "national",
    created_at: "2025-01-10T08:00:00Z"
  }
];

export const assignedCoaches: Record<string, string> = {
  [athletes[0].id]: "Coach Meera Singh",
  [athletes[1].id]: "Coach Karan Bedi",
  [athletes[2].id]: "Coach Nila Krishnan",
  [athletes[3].id]: "Coach Vikram Patil"
};

export const lastMedicalChecks: Record<string, string> = {
  [athletes[0].id]: "2025-02-20",
  [athletes[1].id]: "2025-02-13",
  [athletes[2].id]: "2025-02-28",
  [athletes[3].id]: "2025-02-06"
};

export const riskScores: RiskScore[] = [
  { id: 1, athlete_id: athletes[0].id, score: 0.82, risk_level: "critical", contributing_factors: [{ title: "High training load", impact: "+35%" }], computed_at: "2025-03-12T07:00:00Z", model_version: "injury-v1.3.0" },
  { id: 2, athlete_id: athletes[1].id, score: 0.68, risk_level: "high", contributing_factors: [{ title: "Reduced sleep", impact: "+18%" }], computed_at: "2025-03-12T07:00:00Z", model_version: "injury-v1.3.0" },
  { id: 3, athlete_id: athletes[2].id, score: 0.28, risk_level: "low", contributing_factors: [{ title: "Stable load", impact: "-8%" }], computed_at: "2025-03-12T07:00:00Z", model_version: "injury-v1.3.0" },
  { id: 4, athlete_id: athletes[3].id, score: 0.52, risk_level: "medium", contributing_factors: [{ title: "Recent travel", impact: "+10%" }], computed_at: "2025-03-12T07:00:00Z", model_version: "injury-v1.3.0" }
];

export const performanceIndices: PerformanceIndex[] = [
  { id: 1, athlete_id: athletes[0].id, session_id: 501, index_name: "Speed", value: 87, percentile_in_sport: 0.89, computed_at: "2025-03-11T08:00:00Z" },
  { id: 2, athlete_id: athletes[1].id, session_id: 502, index_name: "Endurance", value: 82, percentile_in_sport: 0.81, computed_at: "2025-03-11T08:00:00Z" },
  { id: 3, athlete_id: athletes[2].id, session_id: 503, index_name: "Power", value: 78, percentile_in_sport: 0.74, computed_at: "2025-03-11T08:00:00Z" },
  { id: 4, athlete_id: athletes[3].id, session_id: 504, index_name: "Stamina", value: 85, percentile_in_sport: 0.86, computed_at: "2025-03-11T08:00:00Z" }
];

export const sessions: SessionLog[] = [
  { id: 501, athlete_id: athletes[0].id, sport_id: 1, session_type: "training", start_time: "2025-03-11T06:00:00Z", end_time: "2025-03-11T07:35:00Z", rpe: 7, notes: "Speed endurance", raw_metrics: { distance: 8.5 }, computed_metrics: { acwr: 1.37, load: 82 }, coach_id: null },
  { id: 502, athlete_id: athletes[1].id, sport_id: 1, session_type: "training", start_time: "2025-03-11T07:00:00Z", end_time: "2025-03-11T08:00:00Z", rpe: 6, notes: "Tempo ladders", raw_metrics: { distance: 7.1 }, computed_metrics: { acwr: 1.21, load: 68 }, coach_id: null },
  { id: 503, athlete_id: athletes[2].id, sport_id: 2, session_type: "recovery", start_time: "2025-03-10T15:00:00Z", end_time: "2025-03-10T15:40:00Z", rpe: 3, notes: "Mobility", raw_metrics: { distance: 2.2 }, computed_metrics: { acwr: 0.92, load: 21 }, coach_id: null },
  { id: 504, athlete_id: athletes[3].id, sport_id: 3, session_type: "competition", start_time: "2025-03-10T13:00:00Z", end_time: "2025-03-10T14:40:00Z", rpe: 8, notes: "Practice match", raw_metrics: { distance: 5.4 }, computed_metrics: { acwr: 1.11, load: 88 }, coach_id: null }
];

export const talentSignals: TalentSignal[] = [
  { id: 1, athlete_id: athletes[0].id, signal_type: "breakthrough", computed_at: "2025-03-10T00:00:00Z", evidence: [{ title: "Breakthrough detected", message: "Hurdle rhythm improved." }] },
  { id: 2, athlete_id: athletes[2].id, signal_type: "emerging", computed_at: "2025-03-09T00:00:00Z", evidence: [{ title: "Emerging power trend", message: "Punch output rose." }] },
  { id: 3, athlete_id: athletes[1].id, signal_type: "plateau", computed_at: "2025-03-08T00:00:00Z", evidence: [{ title: "Load stable", message: "Need fresh stimulus." }] }
];

export const talentBoard: TalentBoardAthlete[] = [
  { athleteId: athletes[2].id, name: athletes[2].name, sport: "Boxing", tier: "Emerging", topIndex: 78, recentSignal: "Emerging power trend", highlighted: true },
  { athleteId: athletes[1].id, name: athletes[1].name, sport: "Athletics", tier: "National Contender", topIndex: 82, recentSignal: "Load stable", highlighted: false },
  { athleteId: athletes[0].id, name: athletes[0].name, sport: "Athletics", tier: "Elite", topIndex: 87, recentSignal: "Breakthrough detected", highlighted: true },
  { athleteId: athletes[3].id, name: athletes[3].name, sport: "Hockey", tier: "Olympic Potential", topIndex: 85, recentSignal: "Selection watch", highlighted: false }
];

export const grants: GrantRecord[] = [
  { id: 1, athlete_id: athletes[0].id, grant_scheme: "TOPS", amount: "150000", disbursed_at: "2025-02-10T00:00:00Z", next_disbursement_date: "2025-06-10", conditions: "Submit utilization report" },
  { id: 2, athlete_id: athletes[1].id, grant_scheme: "KheloIndia", amount: "80000", disbursed_at: "2025-01-20T00:00:00Z", next_disbursement_date: "2025-04-15", conditions: "Maintain attendance" },
  { id: 3, athlete_id: athletes[3].id, grant_scheme: "StateGovt", amount: "60000", disbursed_at: "2025-03-01T00:00:00Z", next_disbursement_date: "2025-04-03", conditions: "Competition travel support" }
];

export const eligibleGrantAthletes = athletes.filter((athlete) => athlete.id !== athletes[2].id);

export const reports: ReportJob[] = [
  { id: "report-1", name: "Monthly Performance Summary", format: "pdf", status: "complete", createdAt: "2025-03-01T10:00:00Z", downloadUrl: "/downloads/monthly-performance.pdf" }
];

export const consentAudit: ConsentAudit[] = [
  { id: "consent-1", athleteId: athletes[0].id, athleteName: athletes[0].name, dataCategory: "health", consented: true, date: "2025-01-15", revokedDate: null },
  { id: "consent-2", athleteId: athletes[0].id, athleteName: athletes[0].name, dataCategory: "financial", consented: true, date: "2025-01-15", revokedDate: null },
  { id: "consent-3", athleteId: athletes[1].id, athleteName: athletes[1].name, dataCategory: "financial", consented: false, date: "2025-01-12", revokedDate: "2025-02-20" },
  { id: "consent-4", athleteId: athletes[2].id, athleteName: athletes[2].name, dataCategory: "performance", consented: true, date: "2025-01-11", revokedDate: null }
];

export const notifications: Notification[] = [
  { id: "note-1", recipient_id: federationProfile.id, notification_type: "INJURY_RISK_CRITICAL", title: "Critical alert", body: "Aarohi Sharma crossed critical risk threshold", channel: "in_app", priority: "critical", is_read: false, sent_at: "2025-03-12T07:00:00Z", created_at: "2025-03-12T07:00:00Z", metadata: {} }
];

export const careerGoals: CareerGoal[] = [
  { id: 10, athlete_id: athletes[0].id, goal_type: "peak_event", target_date: "2025-05-21", priority_event: "National Championships", status: "active", created_at: "2025-01-01T00:00:00Z" }
];
