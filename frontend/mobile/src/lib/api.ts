import axios from "axios";

import type { Athlete, CareerGoal, CashflowForecast, DevelopmentPlan, FileRecord, GrantRecord, IncomeRecord, InjuryRecord, Notification, NotificationPreference, PerformanceIndex, RiskScore, SessionLog, Sport, TalentSignal } from "../shared";

import { env } from "../constants/env";

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000
});

export type DashboardPayload = {
  athlete: Athlete;
  sport: Sport;
  riskScore: RiskScore;
  sessions: SessionLog[];
  performanceIndices: PerformanceIndex[];
  notifications: Notification[];
  careerGoals: CareerGoal[];
};

const athleteId = "550e8400-e29b-41d4-a716-446655440000";

export const mockData: DashboardPayload & {
  developmentPlan: DevelopmentPlan;
  injuryHistory: InjuryRecord[];
  grants: GrantRecord[];
  income: IncomeRecord[];
  cashflow: CashflowForecast[];
  notificationPreferences: NotificationPreference[];
  talentSignals: TalentSignal[];
  files: FileRecord[];
} = {
  athlete: {
    id: athleteId,
    name: "Aarohi Sharma",
    dob: "2004-08-10",
    gender: "female",
    sport_id: 1,
    state: "Haryana",
    tier: "elite",
    created_at: "2025-01-15T08:00:00Z"
  },
  sport: {
    id: 1,
    name: "Athletics",
    category: "individual",
    ontology_tags: { event: "400m hurdles" }
  },
  riskScore: {
    id: 1,
    athlete_id: athleteId,
    score: 0.72,
    risk_level: "high",
    contributing_factors: [
      { title: "High training load this week", impact: "+35% risk" },
      { title: "Reduced sleep average", impact: "+12% risk" }
    ],
    computed_at: "2025-03-12T07:00:00Z",
    model_version: "injury-v1.3.0"
  },
  sessions: [
    {
      id: 501,
      athlete_id: athleteId,
      sport_id: 1,
      session_type: "training",
      start_time: "2025-03-11T06:00:00Z",
      end_time: "2025-03-11T07:35:00Z",
      rpe: 7,
      notes: "Speed endurance work",
      raw_metrics: { distance: 8.5, avg_hr: 156, max_hr: 184 },
      computed_metrics: { load: 82 },
      coach_id: null
    },
    {
      id: 500,
      athlete_id: athleteId,
      sport_id: 1,
      session_type: "recovery",
      start_time: "2025-03-10T15:00:00Z",
      end_time: "2025-03-10T15:45:00Z",
      rpe: 3,
      notes: "Mobility and flush run",
      raw_metrics: { distance: 3.1, avg_hr: 118, max_hr: 136 },
      computed_metrics: { load: 21 },
      coach_id: null
    }
  ],
  performanceIndices: [
    { id: 1, athlete_id: athleteId, session_id: 501, index_name: "Speed", value: 87, percentile_in_sport: 0.89, computed_at: "2025-03-11T08:00:00Z" },
    { id: 2, athlete_id: athleteId, session_id: 501, index_name: "Endurance", value: 79, percentile_in_sport: 0.76, computed_at: "2025-03-11T08:00:00Z" },
    { id: 3, athlete_id: athleteId, session_id: 501, index_name: "Recovery", value: 68, percentile_in_sport: 0.61, computed_at: "2025-03-11T08:00:00Z" }
  ],
  notifications: [
    {
      id: "550e8400-e29b-41d4-a716-446655440111",
      recipient_id: athleteId,
      notification_type: "INJURY_RISK_CRITICAL",
      title: "Risk spike detected",
      body: "Recovery score dipped after two high-load sessions.",
      channel: "in_app",
      priority: "critical",
      is_read: false,
      sent_at: "2025-03-12T07:10:00Z",
      created_at: "2025-03-12T07:10:00Z",
      metadata: {}
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440112",
      recipient_id: athleteId,
      notification_type: "GRANT_DEADLINE",
      title: "Grant deadline in 5 days",
      body: "Complete your state grant submission this week.",
      channel: "in_app",
      priority: "medium",
      is_read: false,
      sent_at: "2025-03-11T06:00:00Z",
      created_at: "2025-03-11T06:00:00Z",
      metadata: {}
    }
  ],
  careerGoals: [
    {
      id: 9,
      athlete_id: athleteId,
      goal_type: "peak_event",
      target_date: "2025-05-21",
      priority_event: "National Championships",
      status: "active",
      created_at: "2025-01-01T00:00:00Z"
    }
  ],
  developmentPlan: {
    id: 8,
    athlete_id: athleteId,
    coach_id: athleteId,
    plan_period_start: "2025-03-01",
    plan_period_end: "2025-06-01",
    goals: [{ title: "Improve hurdle clearance" }],
    periodization_blocks: [
      { block_name: "Base", start_date: "2025-03-01", end_date: "2025-03-21", focus_areas: ["Aerobic", "Mobility"], volume_target: 0.7 },
      { block_name: "Build", start_date: "2025-03-22", end_date: "2025-04-20", focus_areas: ["Speed", "Strength"], volume_target: 0.85 },
      { block_name: "Peak", start_date: "2025-04-21", end_date: "2025-05-21", focus_areas: ["Race pace"], volume_target: 0.6 }
    ],
    created_at: "2025-03-01T00:00:00Z",
    updated_at: "2025-03-10T00:00:00Z"
  },
  injuryHistory: [
    {
      id: 41,
      athlete_id: athleteId,
      body_part: "Hamstring",
      injury_type: "Strain",
      severity: "moderate",
      occurred_at: "2024-10-16T00:00:00Z",
      returned_at: "2024-11-04T00:00:00Z",
      reported_by: athleteId,
      notes: "Managed with progressive rehab"
    }
  ],
  grants: [
    {
      id: 2,
      athlete_id: athleteId,
      grant_scheme: "TOPS",
      amount: "150000",
      disbursed_at: "2025-02-10T00:00:00Z",
      next_disbursement_date: "2025-06-10",
      conditions: "Submit training utilization report"
    }
  ],
  income: [
    {
      id: 17,
      athlete_id: athleteId,
      source_type: "government_grant",
      amount: "450000",
      currency: "INR",
      received_at: "2025-01-20T00:00:00Z",
      fiscal_year: "2024-25",
      notes: null,
      verified: true
    },
    {
      id: 18,
      athlete_id: athleteId,
      source_type: "sponsorship",
      amount: "200000",
      currency: "INR",
      received_at: "2025-02-18T00:00:00Z",
      fiscal_year: "2024-25",
      notes: null,
      verified: true
    }
  ],
  cashflow: Array.from({ length: 12 }).map((_, index) => ({
    id: index + 1,
    athlete_id: athleteId,
    month: `2025-${String(index + 1).padStart(2, "0")}-01`,
    projected_income: String(index % 3 === 0 ? 120000 : 55000),
    projected_expense: String(index % 4 === 0 ? 90000 : 60000),
    deficit_flag: index === 6 || index === 9,
    computed_at: "2025-03-01T00:00:00Z"
  })),
  notificationPreferences: [
    { id: 1, user_id: athleteId, notification_type: "risk_alert", in_app_enabled: true, email_enabled: true, push_enabled: true },
    { id: 2, user_id: athleteId, notification_type: "grant_deadline", in_app_enabled: true, email_enabled: true, push_enabled: false }
  ],
  talentSignals: [
    {
      id: 1,
      athlete_id: athleteId,
      signal_type: "breakthrough",
      computed_at: "2025-03-10T00:00:00Z",
      evidence: [{ title: "Breakthrough detected this week", message: "Hurdle rhythm improved across 4 sessions." }]
    }
  ],
  files: []
};

export const apiClient = {
  async login(email: string, _password: string) {
    return {
      user: {
        id: athleteId,
        name: "Aarohi Sharma",
        email,
        role: "athlete" as const,
        athlete_id: athleteId,
        is_active: true
      },
      tokens: {
        access_token: "demo-access-token",
        refresh_token: "demo-refresh-token",
        token_type: "bearer" as const
      }
    };
  },
  async register(name: string, email: string) {
    return this.login(email, "password").then((session) => ({ ...session, user: { ...session.user, name } }));
  },
  async getDashboard(): Promise<DashboardPayload> {
    return mockData;
  },
  async getPerformance() {
    return {
      sessions: mockData.sessions,
      indices: mockData.performanceIndices,
      riskScore: mockData.riskScore
    };
  },
  async getInjuryOverview() {
    return {
      riskScore: mockData.riskScore,
      injuryHistory: mockData.injuryHistory
    };
  },
  async getCareerOverview() {
    return {
      goals: mockData.careerGoals,
      plan: mockData.developmentPlan,
      talentSignal: mockData.talentSignals[0] ?? null
    };
  },
  async getFinancialOverview() {
    return {
      income: mockData.income,
      grants: mockData.grants,
      cashflow: mockData.cashflow
    };
  },
  async getNotifications() {
    return mockData.notifications;
  },
  async saveSession(session: SessionLog) {
    return { ...session, id: Date.now() };
  },
  async registerPushToken(_token: string) {
    return { ok: true };
  },
  async uploadProfilePhoto(uri: string) {
    return { uri };
  }
};
