import type {
  AthleteTier,
  CareerGoalStatus,
  CareerGoalType,
  FileAccessLevel,
  FileType,
  GrantScheme,
  IncomeSourceType,
  InjurySeverity,
  NotificationChannel,
  SessionType,
  SportCategory
} from "./api";
import type { UserRole } from "./auth";

export type LoginFormValues = {
  email: string;
  password: string;
};

export type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  athlete_id?: string;
};

export type AthleteFormValues = {
  name: string;
  dob: string;
  gender: string;
  sport_id: number;
  state: string;
  tier: AthleteTier;
};

export type SportFormValues = {
  name: string;
  category: SportCategory;
  ontology_tags: Record<string, unknown>;
};

export type SessionLogFormValues = {
  athlete_id: string;
  sport_id: number;
  session_type: SessionType;
  start_time: string;
  end_time?: string | null;
  rpe?: number | null;
  notes?: string | null;
  raw_metrics: Record<string, unknown>;
  computed_metrics: Record<string, unknown>;
  coach_id?: string | null;
};

export type InjuryRecordFormValues = {
  athlete_id: string;
  body_part: string;
  injury_type: string;
  severity: InjurySeverity;
  occurred_at: string;
  returned_at?: string | null;
  reported_by: string;
  notes?: string | null;
};

export type CareerGoalFormValues = {
  athlete_id: string;
  goal_type: CareerGoalType;
  target_date: string;
  priority_event?: string | null;
  status: CareerGoalStatus;
};

export type DevelopmentPlanFormValues = {
  athlete_id: string;
  coach_id: string;
  plan_period_start: string;
  plan_period_end: string;
  goals: Record<string, unknown>[];
  periodization_blocks: {
    block_name: string;
    start_date: string;
    end_date: string;
    focus_areas: string[];
    volume_target: number;
  }[];
};

export type IncomeRecordFormValues = {
  athlete_id: string;
  source_type: IncomeSourceType;
  amount: string;
  currency: string;
  received_at: string;
  fiscal_year: string;
  notes?: string | null;
  verified: boolean;
};

export type GrantRecordFormValues = {
  athlete_id: string;
  grant_scheme: GrantScheme;
  amount: string;
  disbursed_at: string;
  next_disbursement_date?: string | null;
  conditions?: string | null;
};

export type NotificationPreferenceFormValues = {
  notification_type: string;
  channels: NotificationChannel[];
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
};

export type FileUploadFormValues = {
  athlete_id: string;
  file_type: FileType;
  filename: string;
  mime_type: string;
  size_bytes: number;
  access_level: FileAccessLevel;
};
