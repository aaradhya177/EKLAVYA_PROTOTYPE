import type {
  Athlete,
  CareerGoal,
  CashflowForecast,
  DevelopmentPlan,
  FileRecord,
  GrantRecord,
  IncomeRecord,
  InjuryRecord,
  Notification,
  NotificationPreference,
  PerformanceIndex,
  RiskScore,
  SessionLog
} from "../types";

export type {
  Athlete,
  CareerGoal,
  CashflowForecast,
  DevelopmentPlan,
  FileRecord,
  GrantRecord,
  IncomeRecord,
  InjuryRecord,
  Notification,
  NotificationPreference,
  PerformanceIndex,
  RiskScore,
  SessionLog
} from "../types";

export type EventLog = {
  id: number;
  athlete_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  source: "wearable" | "manual" | "api";
  recorded_at: string;
};

export type FeatureSnapshot = {
  id: number;
  athlete_id: string;
  feature_name: string;
  value: number;
  window: "7d" | "28d" | "90d";
  computed_at: string;
};

export type TrendPoint = {
  timestamp: string;
  value: number;
};

export type Alert = {
  athlete_id: string;
  index_name: string;
  value: number;
  level: string;
  threshold: string;
  computed_at: string;
};

export type SHAPFactor = {
  name: string;
  contribution: number;
  message: string;
};

export type RiskAlert = {
  athleteId: string;
  athleteName: string;
  level: RiskScore["risk_level"];
  score: number;
  topFactor: string;
  computedAt: string;
};

export type CareerMilestone = {
  id: number;
  athlete_id: string;
  milestone_type: string;
  achieved_at: string;
  description: string;
  verified_by: string | null;
};

export type FinancialSummary = {
  id: number;
  athlete_id: string;
  fiscal_year: string;
  total_income: string;
  total_expense: string;
  net_savings: string;
  computed_at: string;
};

export type ExpenseRecord = {
  id: number;
  athlete_id: string;
  category: "coaching" | "equipment" | "travel" | "medical" | "academy_fee" | "other";
  amount: string;
  paid_at: string;
  fiscal_year: string;
  notes: string | null;
};

export type GrantEligibility = {
  athlete_id: string;
  scheme: "TOPS" | "KheloIndia" | "StateGovt" | "Other";
  eligible: boolean;
  reason: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: "athlete" | "coach" | "federation_admin" | "sys_admin";
  athlete_id?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
};

export type AuthUser = {
  id: string;
  name: string;
  email: string | null;
  role: "athlete" | "coach" | "federation_admin" | "sys_admin";
  athlete_id: string | null;
  is_active: boolean;
};

export type APIResponse<T> = {
  status: "ok" | "error";
  data: T;
  message: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  per_page: number;
};

export type ApiEntities = {
  Athlete: Athlete;
  SessionLog: SessionLog;
  PerformanceIndex: PerformanceIndex;
  RiskScore: RiskScore;
  InjuryRecord: InjuryRecord;
  CareerGoal: CareerGoal;
  DevelopmentPlan: DevelopmentPlan;
  CashflowForecast: CashflowForecast;
  GrantRecord: GrantRecord;
  IncomeRecord: IncomeRecord;
  Notification: Notification;
  NotificationPreference: NotificationPreference;
  FileRecord: FileRecord;
};
