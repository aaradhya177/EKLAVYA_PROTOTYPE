export type UUID = string;
export type ISODateString = string;
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type AthleteTier = "grassroots" | "state" | "national" | "elite";
export type SportCategory = "individual" | "team";
export type SessionType = "training" | "competition" | "recovery";
export type InjurySeverity = "mild" | "moderate" | "severe";
export type CareerGoalType = "peak_event" | "extend_career" | "transition" | "retirement";
export type CareerGoalStatus = "active" | "achieved" | "abandoned";
export type TalentSignalType = "breakthrough" | "plateau" | "decline" | "emerging";
export type IncomeSourceType = "prize_money" | "sponsorship" | "government_grant" | "appearance_fee" | "other";
export type GrantScheme = "TOPS" | "KheloIndia" | "StateGovt" | "Other";
export type NotificationChannel = "in_app" | "email" | "push";
export type NotificationPriority = "low" | "medium" | "high" | "critical";
export type FileType = "video" | "medical_report" | "document" | "profile_photo" | "training_plan";
export type FileAccessLevel = "private" | "coach_visible" | "federation_visible" | "public";
export type FileUploadStatus = "pending" | "processing" | "ready" | "failed" | "flagged" | "deleted";

export type Sport = {
  id: number;
  name: string;
  category: SportCategory;
  ontology_tags: Record<string, unknown>;
};

export type Athlete = {
  id: UUID;
  name: string;
  dob: string;
  gender: string;
  sport_id: number;
  state: string;
  tier: AthleteTier;
  created_at: ISODateString;
};

export type SessionLog = {
  id: number;
  athlete_id: UUID;
  sport_id: number;
  session_type: SessionType;
  start_time: ISODateString;
  end_time: ISODateString | null;
  rpe: number | null;
  notes: string | null;
  raw_metrics: Record<string, unknown>;
  computed_metrics: Record<string, unknown>;
  coach_id: UUID | null;
};

export type PerformanceIndex = {
  id: number;
  athlete_id: UUID;
  session_id: number | null;
  index_name: string;
  value: number;
  percentile_in_sport: number;
  computed_at: ISODateString;
};

export type InjuryRecord = {
  id: number;
  athlete_id: UUID;
  body_part: string;
  injury_type: string;
  severity: InjurySeverity;
  occurred_at: ISODateString;
  returned_at: ISODateString | null;
  reported_by: UUID;
  notes: string | null;
};

export type RiskFactor = Record<string, unknown>;

export type RiskScore = {
  id: number;
  athlete_id: UUID;
  score: number;
  risk_level: RiskLevel;
  contributing_factors: RiskFactor[];
  computed_at: ISODateString;
  model_version: string;
};

export type CareerGoal = {
  id: number;
  athlete_id: UUID;
  goal_type: CareerGoalType;
  target_date: string;
  priority_event: string | null;
  status: CareerGoalStatus;
  created_at: ISODateString;
};

export type DevelopmentPlanBlock = {
  block_name: string;
  start_date: string;
  end_date: string;
  focus_areas: string[];
  volume_target: number;
};

export type DevelopmentPlan = {
  id: number;
  athlete_id: UUID;
  coach_id: UUID;
  plan_period_start: string;
  plan_period_end: string;
  goals: Record<string, unknown>[];
  periodization_blocks: DevelopmentPlanBlock[];
  created_at: ISODateString;
  updated_at: ISODateString;
};

export type IncomeRecord = {
  id: number;
  athlete_id: UUID;
  source_type: IncomeSourceType;
  amount: string;
  currency: string;
  received_at: ISODateString;
  fiscal_year: string;
  notes: string | null;
  verified: boolean;
};

export type GrantRecord = {
  id: number;
  athlete_id: UUID;
  grant_scheme: GrantScheme;
  amount: string;
  disbursed_at: ISODateString;
  next_disbursement_date: string | null;
  conditions: string | null;
};

export type CashflowForecast = {
  id: number;
  athlete_id: UUID;
  month: string;
  projected_income: string;
  projected_expense: string;
  deficit_flag: boolean;
  computed_at: ISODateString;
};

export type Notification = {
  id: UUID;
  recipient_id: UUID;
  notification_type: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  is_read: boolean;
  sent_at: ISODateString | null;
  created_at: ISODateString;
  metadata: Record<string, unknown>;
};

export type NotificationPreference = {
  id: number;
  user_id: UUID;
  notification_type: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
};

export type FileRecord = {
  id: UUID;
  uploader_id: UUID;
  athlete_id: UUID;
  file_type: FileType;
  original_filename: string;
  stored_key: string;
  mime_type: string;
  size_bytes: number;
  access_level: FileAccessLevel;
  upload_status: FileUploadStatus;
  metadata: Record<string, unknown>;
  created_at: ISODateString;
  tags: string[];
};

export type TalentSignal = {
  id: number;
  athlete_id: UUID;
  signal_type: TalentSignalType;
  computed_at: ISODateString;
  evidence: Record<string, unknown>[];
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
