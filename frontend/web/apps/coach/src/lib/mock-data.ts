import type {
  Athlete,
  CareerGoal,
  DevelopmentPlan,
  FileRecord,
  Notification,
  PerformanceIndex,
  RiskScore,
  SessionLog,
  Sport,
  TalentSignal
} from "../../../../../shared/types";

export type CoachProfile = {
  id: string;
  name: string;
  sport: string;
};

export type CoachAlert = {
  id: string;
  athleteId: string;
  athleteName: string;
  riskLevel: RiskScore["risk_level"];
  score: number;
  topFactor: string;
  time: string;
  reviewed: boolean;
};

export type PlanBlock = {
  id: string;
  blockName: string;
  startDate: string;
  endDate: string;
  focusAreas: string[];
  volumeTarget: number;
};

export const coachProfile: CoachProfile = {
  id: "coach-1",
  name: "Coach Meera Singh",
  sport: "Athletics"
};

export const sports: Sport[] = [
  { id: 1, name: "Athletics", category: "individual", ontology_tags: {} },
  { id: 2, name: "Boxing", category: "individual", ontology_tags: {} }
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
  }
];

export const riskScores: RiskScore[] = [
  {
    id: 1,
    athlete_id: athletes[0].id,
    score: 0.82,
    risk_level: "critical",
    contributing_factors: [{ title: "High training load this week", impact: "+35% risk" }, { title: "Travel fatigue", impact: "+14% risk" }],
    computed_at: "2025-03-12T07:00:00Z",
    model_version: "injury-v1.3.0"
  },
  {
    id: 2,
    athlete_id: athletes[1].id,
    score: 0.68,
    risk_level: "high",
    contributing_factors: [{ title: "Reduced sleep average", impact: "+18% risk" }],
    computed_at: "2025-03-12T07:00:00Z",
    model_version: "injury-v1.3.0"
  },
  {
    id: 3,
    athlete_id: athletes[2].id,
    score: 0.28,
    risk_level: "low",
    contributing_factors: [{ title: "Stable load", impact: "-8% risk" }],
    computed_at: "2025-03-12T07:00:00Z",
    model_version: "injury-v1.3.0"
  }
];

export const sessions: SessionLog[] = [
  {
    id: 501,
    athlete_id: athletes[0].id,
    sport_id: 1,
    session_type: "training",
    start_time: "2025-03-11T06:00:00Z",
    end_time: "2025-03-11T07:35:00Z",
    rpe: 7,
    notes: "Speed endurance work",
    raw_metrics: { distance: 8.5, avg_hr: 156, max_hr: 184 },
    computed_metrics: { acwr: 1.37, load: 82 },
    coach_id: null
  },
  {
    id: 502,
    athlete_id: athletes[1].id,
    sport_id: 1,
    session_type: "training",
    start_time: "2025-03-11T07:00:00Z",
    end_time: "2025-03-11T08:00:00Z",
    rpe: 6,
    notes: "Tempo ladders",
    raw_metrics: { distance: 7.1, avg_hr: 149, max_hr: 173 },
    computed_metrics: { acwr: 1.21, load: 68 },
    coach_id: null
  },
  {
    id: 503,
    athlete_id: athletes[2].id,
    sport_id: 2,
    session_type: "recovery",
    start_time: "2025-03-10T15:00:00Z",
    end_time: "2025-03-10T15:40:00Z",
    rpe: 3,
    notes: "Mobility and shadow work",
    raw_metrics: { distance: 2.2, avg_hr: 120, max_hr: 138 },
    computed_metrics: { acwr: 0.92, load: 21 },
    coach_id: null
  }
];

export const performanceIndices: PerformanceIndex[] = [
  { id: 1, athlete_id: athletes[0].id, session_id: 501, index_name: "Speed", value: 87, percentile_in_sport: 0.89, computed_at: "2025-03-11T08:00:00Z" },
  { id: 2, athlete_id: athletes[0].id, session_id: 501, index_name: "Endurance", value: 79, percentile_in_sport: 0.76, computed_at: "2025-03-11T08:00:00Z" },
  { id: 3, athlete_id: athletes[0].id, session_id: 501, index_name: "Recovery", value: 68, percentile_in_sport: 0.61, computed_at: "2025-03-11T08:00:00Z" }
];

export const careerGoals: CareerGoal[] = [
  {
    id: 9,
    athlete_id: athletes[0].id,
    goal_type: "peak_event",
    target_date: "2025-05-21",
    priority_event: "National Championships",
    status: "active",
    created_at: "2025-01-01T00:00:00Z"
  }
];

export const developmentPlans: Record<string, DevelopmentPlan> = {
  [athletes[0].id]: {
    id: 8,
    athlete_id: athletes[0].id,
    coach_id: "coach-1",
    plan_period_start: "2025-03-01",
    plan_period_end: "2025-06-01",
    goals: [{ title: "Improve hurdle clearance" }],
    periodization_blocks: [
      { block_name: "Base", start_date: "2025-03-01", end_date: "2025-03-21", focus_areas: ["Aerobic", "Mobility"], volume_target: 5 },
      { block_name: "Build", start_date: "2025-03-22", end_date: "2025-04-20", focus_areas: ["Speed", "Strength"], volume_target: 6 },
      { block_name: "Peak", start_date: "2025-04-21", end_date: "2025-05-21", focus_areas: ["Race pace"], volume_target: 4 }
    ],
    created_at: "2025-03-01T00:00:00Z",
    updated_at: "2025-03-10T00:00:00Z"
  }
};

export const alerts: CoachAlert[] = [
  {
    id: "alert-1",
    athleteId: athletes[0].id,
    athleteName: athletes[0].name,
    riskLevel: "critical",
    score: 0.82,
    topFactor: "High training load this week",
    time: "2025-03-12T07:10:00Z",
    reviewed: false
  },
  {
    id: "alert-2",
    athleteId: athletes[1].id,
    athleteName: athletes[1].name,
    riskLevel: "high",
    score: 0.68,
    topFactor: "Reduced sleep average",
    time: "2025-03-12T07:12:00Z",
    reviewed: false
  }
];

export const talentSignals: TalentSignal[] = [
  {
    id: 1,
    athlete_id: athletes[0].id,
    signal_type: "breakthrough",
    computed_at: "2025-03-10T00:00:00Z",
    evidence: [{ title: "Breakthrough detected this week", message: "Hurdle rhythm improved across 4 sessions." }]
  },
  {
    id: 2,
    athlete_id: athletes[2].id,
    signal_type: "emerging",
    computed_at: "2025-03-09T00:00:00Z",
    evidence: [{ title: "Emerging power trend", message: "Punch output rose for three straight weeks." }]
  }
];

export const notifications: Notification[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440111",
    recipient_id: "coach-1",
    notification_type: "INJURY_RISK_CRITICAL",
    title: "Risk spike detected",
    body: "Recovery score dipped after two high-load sessions.",
    channel: "in_app",
    priority: "critical",
    is_read: false,
    sent_at: "2025-03-12T07:10:00Z",
    created_at: "2025-03-12T07:10:00Z",
    metadata: {}
  }
];

export const files: FileRecord[] = [
  {
    id: "file-1",
    uploader_id: "coach-1",
    athlete_id: athletes[0].id,
    file_type: "video",
    original_filename: "stride-analysis.mp4",
    stored_key: "files/stride-analysis.mp4",
    mime_type: "video/mp4",
    size_bytes: 1024000,
    access_level: "coach_visible",
    upload_status: "ready",
    metadata: {},
    created_at: "2025-03-11T09:00:00Z",
    tags: ["analysis"]
  },
  {
    id: "file-2",
    uploader_id: "coach-1",
    athlete_id: athletes[1].id,
    file_type: "document",
    original_filename: "training-plan.pdf",
    stored_key: "files/training-plan.pdf",
    mime_type: "application/pdf",
    size_bytes: 402400,
    access_level: "coach_visible",
    upload_status: "ready",
    metadata: {},
    created_at: "2025-03-11T09:30:00Z",
    tags: ["plan"]
  }
];
