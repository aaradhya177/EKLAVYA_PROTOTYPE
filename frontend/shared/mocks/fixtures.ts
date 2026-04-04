import type {
  APIResponse,
  Alert,
  Athlete,
  AuthTokens,
  AuthUser,
  CareerGoal,
  CareerMilestone,
  CashflowForecast,
  DevelopmentPlan,
  EventLog,
  ExpenseRecord,
  FeatureSnapshot,
  FileRecord,
  FinancialSummary,
  GrantEligibility,
  GrantRecord,
  IncomeRecord,
  InjuryRecord,
  Notification,
  NotificationPreference,
  PaginatedResponse,
  PerformanceIndex,
  RegisterPayload,
  RiskAlert,
  RiskScore,
  SessionLog,
  SHAPFactor,
  TalentSignal,
  TrendPoint
} from "../api/types";

const athleteId = "athlete-1";

export const authUserFixture: AuthUser = {
  id: "user-1",
  name: "Aarav Singh",
  email: "aarav@example.com",
  role: "athlete",
  athlete_id: athleteId,
  is_active: true
};

export const authTokensFixture: AuthTokens = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  token_type: "bearer"
};

export const athleteFixture: Athlete = {
  id: athleteId,
  name: "Aarav Singh",
  dob: "2000-02-15",
  gender: "male",
  sport_id: 1,
  state: "Karnataka",
  tier: "national",
  created_at: "2025-03-01T08:00:00.000Z"
};

export const sessionFixture: SessionLog = {
  id: 101,
  athlete_id: athleteId,
  sport_id: 1,
  session_type: "training",
  start_time: "2025-03-12T06:30:00.000Z",
  end_time: "2025-03-12T08:00:00.000Z",
  rpe: 7,
  notes: "Tempo block",
  raw_metrics: { distance_km: 12.4 },
  computed_metrics: { load: 84 },
  coach_id: "coach-1"
};

export const performanceSummaryFixture: PerformanceIndex[] = [
  {
    id: 1,
    athlete_id: athleteId,
    session_id: 101,
    index_name: "speed",
    value: 78,
    percentile_in_sport: 91,
    computed_at: "2025-03-12T08:10:00.000Z"
  }
];

export const trendFixture: TrendPoint[] = [
  { value: 70, timestamp: "2025-03-10T00:00:00.000Z" },
  { value: 73, timestamp: "2025-03-11T00:00:00.000Z" }
];

export const alertFixture: Alert[] = [
  {
    athlete_id: athleteId,
    index_name: "acwr",
    value: 1.41,
    level: "high",
    threshold: "1.3",
    computed_at: "2025-03-12T08:30:00.000Z"
  }
];

export const eventFixture: EventLog = {
  id: 1,
  athlete_id: athleteId,
  event_type: "session_logged",
  payload: { source: "mobile" },
  source: "manual",
  recorded_at: "2025-03-12T08:00:00.000Z"
};

export const featureFixtures: FeatureSnapshot[] = [
  {
    id: 1,
    athlete_id: athleteId,
    feature_name: "acute_load",
    value: 1.2,
    window: "7d",
    computed_at: "2025-03-12T08:10:00.000Z"
  }
];

export const riskScoreFixture: RiskScore = {
  id: 1,
  athlete_id: athleteId,
  score: 0.74,
  risk_level: "high",
  contributing_factors: [{ factor: "load" }],
  computed_at: "2025-03-12T09:00:00.000Z",
  model_version: "injury-v2"
};

export const shapFixtures: SHAPFactor[] = [
  { name: "acute_load", contribution: 0.35, message: "High weekly load" }
];

export const injuryFixtures: InjuryRecord[] = [
  {
    id: 1,
    athlete_id: athleteId,
    body_part: "Hamstring",
    injury_type: "strain",
    severity: "mild",
    occurred_at: "2025-01-10T00:00:00.000Z",
    returned_at: "2025-01-20T00:00:00.000Z",
    reported_by: "coach-1",
    notes: "Recovered well"
  }
];

export const riskAlertsFixture: RiskAlert[] = [
  {
    athleteId: athleteId,
    athleteName: "Aarav Singh",
    level: "critical",
    score: 0.91,
    topFactor: "Back-to-back sessions",
    computedAt: "2025-03-12T09:15:00.000Z"
  }
];

export const goalFixtures: CareerGoal[] = [
  {
    id: 1,
    athlete_id: athleteId,
    goal_type: "peak_event",
    target_date: "2025-09-01",
    priority_event: "Nationals",
    status: "active",
    created_at: "2025-02-01T00:00:00.000Z"
  }
];

export const developmentPlanFixture: DevelopmentPlan = {
  id: 10,
  athlete_id: athleteId,
  coach_id: "coach-1",
  plan_period_start: "2025-04-01",
  plan_period_end: "2025-08-30",
  goals: [{ name: "Nationals peak" }],
  periodization_blocks: [
    {
      block_name: "Base",
      start_date: "2025-04-01",
      end_date: "2025-05-15",
      focus_areas: ["endurance"],
      volume_target: 5
    }
  ],
  created_at: "2025-03-01T00:00:00.000Z",
  updated_at: "2025-03-05T00:00:00.000Z"
};

export const milestoneFixtures: CareerMilestone[] = [
  {
    id: 1,
    athlete_id: athleteId,
    milestone_type: "podium",
    achieved_at: "2024-12-01",
    description: "State podium",
    verified_by: "coach-1"
  }
];

export const talentSignalFixture: TalentSignal = {
  id: 1,
  athlete_id: athleteId,
  signal_type: "breakthrough",
  computed_at: "2025-03-10T00:00:00.000Z",
  evidence: [{ percentile_jump: 12 }]
};

export const financialSummaryFixture: FinancialSummary = {
  id: 1,
  athlete_id: athleteId,
  fiscal_year: "2025-2026",
  total_income: "500000",
  total_expense: "210000",
  net_savings: "290000",
  computed_at: "2025-03-15T00:00:00.000Z"
};

export const forecastFixtures: CashflowForecast[] = [
  {
    id: 1,
    athlete_id: athleteId,
    month: "2025-04",
    projected_income: "35000",
    projected_expense: "22000",
    deficit_flag: false,
    computed_at: "2025-03-15T00:00:00.000Z"
  }
];

export const grantFixtures: GrantRecord[] = [
  {
    id: 1,
    athlete_id: athleteId,
    grant_scheme: "TOPS",
    amount: "150000",
    disbursed_at: "2025-01-15T00:00:00.000Z",
    next_disbursement_date: "2025-07-15",
    conditions: "Maintain performance threshold"
  }
];

export const eligibleGrantFixtures: GrantEligibility[] = [
  {
    athlete_id: athleteId,
    scheme: "Khelo India",
    eligible: true,
    reason: "National camp selection"
  }
];

export const incomeFixture: IncomeRecord = {
  id: 1,
  athlete_id: athleteId,
  source_type: "government_grant",
  amount: "150000",
  currency: "INR",
  received_at: "2025-01-15T00:00:00.000Z",
  fiscal_year: "2025-2026",
  notes: "Quarter 1 support",
  verified: true
};

export const expenseFixture: ExpenseRecord = {
  id: 1,
  athlete_id: athleteId,
  category: "equipment",
  amount: "18000",
  paid_at: "2025-02-10T00:00:00.000Z",
  fiscal_year: "2025-2026",
  notes: "Training spikes"
};

export const notificationFixtures: Notification[] = [
  {
    id: "notif-1",
    recipient_id: "user-1",
    notification_type: "risk_alert",
    title: "Risk increased",
    body: "Critical training load warning",
    channel: "in_app",
    priority: "critical",
    is_read: false,
    sent_at: "2025-03-12T09:20:00.000Z",
    created_at: "2025-03-12T09:20:00.000Z",
    metadata: { screen: "injury" }
  },
  {
    id: "notif-2",
    recipient_id: "user-1",
    notification_type: "grant_deadline",
    title: "Grant reminder",
    body: "Application closes soon",
    channel: "in_app",
    priority: "medium",
    is_read: true,
    sent_at: "2025-03-10T09:20:00.000Z",
    created_at: "2025-03-10T09:20:00.000Z",
    metadata: { screen: "financial" }
  }
];

export const notificationsFixture: PaginatedResponse<Notification> = {
  items: notificationFixtures,
  total: notificationFixtures.length,
  page: 1,
  per_page: 20
};

export const preferencesFixture: NotificationPreference[] = [
  {
    id: 1,
    user_id: "user-1",
    notification_type: "risk_alert",
    in_app_enabled: true,
    email_enabled: true,
    push_enabled: true
  }
];

export const fileFixture: FileRecord = {
  id: "file-1",
  uploader_id: "coach-1",
  athlete_id: athleteId,
  file_type: "document",
  original_filename: "plan.pdf",
  stored_key: "files/plan.pdf",
  mime_type: "application/pdf",
  size_bytes: 2048,
  access_level: "coach_visible",
  upload_status: "ready",
  metadata: {},
  created_at: "2025-03-01T00:00:00.000Z",
  tags: ["plan"]
};

export const registerPayloadFixture: RegisterPayload = {
  name: "Aarav Singh",
  email: "aarav@example.com",
  password: "StrongPass123!",
  role: "athlete"
};

export const envelope = <T>(data: T, message = "ok"): APIResponse<T> => ({
  status: "ok",
  data,
  message
});
