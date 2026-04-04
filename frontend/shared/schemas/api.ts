import { z } from "zod";

const UUIDSchema = z.string().uuid();
const ISODateTimeSchema = z.string().datetime({ offset: true }).or(z.string().datetime());
const ISODateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export const AthleteTierSchema = z.enum(["grassroots", "state", "national", "elite"]);
export const SportCategorySchema = z.enum(["individual", "team"]);
export const SessionTypeSchema = z.enum(["training", "competition", "recovery"]);
export const InjurySeveritySchema = z.enum(["mild", "moderate", "severe"]);
export const CareerGoalTypeSchema = z.enum(["peak_event", "extend_career", "transition", "retirement"]);
export const CareerGoalStatusSchema = z.enum(["active", "achieved", "abandoned"]);
export const TalentSignalTypeSchema = z.enum(["breakthrough", "plateau", "decline", "emerging"]);
export const IncomeSourceTypeSchema = z.enum(["prize_money", "sponsorship", "government_grant", "appearance_fee", "other"]);
export const GrantSchemeSchema = z.enum(["TOPS", "KheloIndia", "StateGovt", "Other"]);
export const NotificationChannelSchema = z.enum(["in_app", "email", "push"]);
export const NotificationPrioritySchema = z.enum(["low", "medium", "high", "critical"]);
export const FileTypeSchema = z.enum(["video", "medical_report", "document", "profile_photo", "training_plan"]);
export const FileAccessLevelSchema = z.enum(["private", "coach_visible", "federation_visible", "public"]);
export const FileUploadStatusSchema = z.enum(["pending", "processing", "ready", "failed", "flagged", "deleted"]);

export const SportSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  category: SportCategorySchema,
  ontology_tags: z.record(z.unknown())
});

export const AthleteSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  dob: ISODateSchema,
  gender: z.string(),
  sport_id: z.number().int(),
  state: z.string(),
  tier: AthleteTierSchema,
  created_at: ISODateTimeSchema
});

export const SessionLogSchema = z.object({
  id: z.number().int(),
  athlete_id: UUIDSchema,
  sport_id: z.number().int(),
  session_type: SessionTypeSchema,
  start_time: ISODateTimeSchema,
  end_time: ISODateTimeSchema.nullable(),
  rpe: z.number().int().min(1).max(10).nullable(),
  notes: z.string().nullable(),
  raw_metrics: z.record(z.unknown()),
  computed_metrics: z.record(z.unknown()),
  coach_id: UUIDSchema.nullable()
});

export const PerformanceIndexSchema = z.object({
  id: z.number().int(),
  athlete_id: UUIDSchema,
  session_id: z.number().int().nullable(),
  index_name: z.string(),
  value: z.number(),
  percentile_in_sport: z.number(),
  computed_at: ISODateTimeSchema
});

export const InjuryRecordSchema = z.object({
  id: z.number().int(),
  athlete_id: UUIDSchema,
  body_part: z.string(),
  injury_type: z.string(),
  severity: InjurySeveritySchema,
  occurred_at: ISODateTimeSchema,
  returned_at: ISODateTimeSchema.nullable(),
  reported_by: UUIDSchema,
  notes: z.string().nullable()
});

export const RiskScoreSchema = z.object({
  id: z.number().int(),
  athlete_id: UUIDSchema,
  score: z.number().min(0).max(1),
  risk_level: RiskLevelSchema,
  contributing_factors: z.array(z.record(z.unknown())),
  computed_at: ISODateTimeSchema,
  model_version: z.string()
});

export const CareerGoalSchema = z.object({
  id: z.number().int(),
  athlete_id: UUIDSchema,
  goal_type: CareerGoalTypeSchema,
  target_date: ISODateSchema,
  priority_event: z.string().nullable(),
  status: CareerGoalStatusSchema,
  created_at: ISODateTimeSchema
});

export const DevelopmentPlanBlockSchema = z.object({
  block_name: z.string(),
  start_date: ISODateSchema,
  end_date: ISODateSchema,
  focus_areas: z.array(z.string()),
  volume_target: z.number().positive()
});

export const DevelopmentPlanSchema = z.object({
  id: z.number().int(),
  athlete_id: UUIDSchema,
  coach_id: UUIDSchema,
  plan_period_start: ISODateSchema,
  plan_period_end: ISODateSchema,
  goals: z.array(z.record(z.unknown())),
  periodization_blocks: z.array(DevelopmentPlanBlockSchema),
  created_at: ISODateTimeSchema,
  updated_at: ISODateTimeSchema
});

export const IncomeRecordSchema = z.object({
  id: z.number().int(),
  athlete_id: UUIDSchema,
  source_type: IncomeSourceTypeSchema,
  amount: z.string(),
  currency: z.string(),
  received_at: ISODateTimeSchema,
  fiscal_year: z.string(),
  notes: z.string().nullable(),
  verified: z.boolean()
});

export const GrantRecordSchema = z.object({
  id: z.number().int(),
  athlete_id: UUIDSchema,
  grant_scheme: GrantSchemeSchema,
  amount: z.string(),
  disbursed_at: ISODateTimeSchema,
  next_disbursement_date: ISODateSchema.nullable(),
  conditions: z.string().nullable()
});

export const CashflowForecastSchema = z.object({
  id: z.number().int(),
  athlete_id: UUIDSchema,
  month: ISODateSchema,
  projected_income: z.string(),
  projected_expense: z.string(),
  deficit_flag: z.boolean(),
  computed_at: ISODateTimeSchema
});

export const NotificationSchema = z.object({
  id: UUIDSchema,
  recipient_id: UUIDSchema,
  notification_type: z.string(),
  title: z.string(),
  body: z.string(),
  channel: NotificationChannelSchema,
  priority: NotificationPrioritySchema,
  is_read: z.boolean(),
  sent_at: ISODateTimeSchema.nullable(),
  created_at: ISODateTimeSchema,
  metadata: z.record(z.unknown())
});

export const NotificationPreferenceSchema = z.object({
  id: z.number().int(),
  user_id: UUIDSchema,
  notification_type: z.string(),
  in_app_enabled: z.boolean(),
  email_enabled: z.boolean(),
  push_enabled: z.boolean()
});

export const FileRecordSchema = z.object({
  id: UUIDSchema,
  uploader_id: UUIDSchema,
  athlete_id: UUIDSchema,
  file_type: FileTypeSchema,
  original_filename: z.string(),
  stored_key: z.string(),
  mime_type: z.string(),
  size_bytes: z.number().int(),
  access_level: FileAccessLevelSchema,
  upload_status: FileUploadStatusSchema,
  metadata: z.record(z.unknown()),
  created_at: ISODateTimeSchema,
  tags: z.array(z.string())
});

export const TalentSignalSchema = z.object({
  id: z.number().int(),
  athlete_id: UUIDSchema,
  signal_type: TalentSignalTypeSchema,
  computed_at: ISODateTimeSchema,
  evidence: z.array(z.record(z.unknown()))
});

export const APIResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.enum(["ok", "error"]),
    data: dataSchema,
    message: z.string()
  });

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int()
  });

export type Sport = z.infer<typeof SportSchema>;
export type Athlete = z.infer<typeof AthleteSchema>;
export type SessionLog = z.infer<typeof SessionLogSchema>;
export type PerformanceIndex = z.infer<typeof PerformanceIndexSchema>;
export type InjuryRecord = z.infer<typeof InjuryRecordSchema>;
export type RiskScore = z.infer<typeof RiskScoreSchema>;
export type CareerGoal = z.infer<typeof CareerGoalSchema>;
export type DevelopmentPlanBlock = z.infer<typeof DevelopmentPlanBlockSchema>;
export type DevelopmentPlan = z.infer<typeof DevelopmentPlanSchema>;
export type IncomeRecord = z.infer<typeof IncomeRecordSchema>;
export type GrantRecord = z.infer<typeof GrantRecordSchema>;
export type CashflowForecast = z.infer<typeof CashflowForecastSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;
export type FileRecord = z.infer<typeof FileRecordSchema>;
export type TalentSignal = z.infer<typeof TalentSignalSchema>;
