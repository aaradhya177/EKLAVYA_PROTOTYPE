import { z } from "zod";

import {
  AthleteTierSchema,
  CareerGoalStatusSchema,
  CareerGoalTypeSchema,
  FileAccessLevelSchema,
  FileTypeSchema,
  GrantSchemeSchema,
  IncomeSourceTypeSchema,
  InjurySeveritySchema,
  NotificationChannelSchema,
  SessionTypeSchema,
  SportCategorySchema
} from "./api";
import { UserRoleSchema } from "./auth";

export const LoginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const RegisterFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: UserRoleSchema,
  athlete_id: z.string().uuid().optional()
});

export const AthleteFormSchema = z.object({
  name: z.string().min(2),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.string().min(1),
  sport_id: z.number().int().positive(),
  state: z.string().min(2),
  tier: AthleteTierSchema
});

export const SportFormSchema = z.object({
  name: z.string().min(2),
  category: SportCategorySchema,
  ontology_tags: z.record(z.unknown())
});

export const SessionLogFormSchema = z.object({
  athlete_id: z.string().uuid(),
  sport_id: z.number().int().positive(),
  session_type: SessionTypeSchema,
  start_time: z.string().datetime({ offset: true }).or(z.string().datetime()),
  end_time: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().nullable().optional(),
  raw_metrics: z.record(z.unknown()),
  computed_metrics: z.record(z.unknown()),
  coach_id: z.string().uuid().nullable().optional()
});

export const InjuryRecordFormSchema = z.object({
  athlete_id: z.string().uuid(),
  body_part: z.string().min(2),
  injury_type: z.string().min(2),
  severity: InjurySeveritySchema,
  occurred_at: z.string().datetime({ offset: true }).or(z.string().datetime()),
  returned_at: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable().optional(),
  reported_by: z.string().uuid(),
  notes: z.string().nullable().optional()
});

export const CareerGoalFormSchema = z.object({
  athlete_id: z.string().uuid(),
  goal_type: CareerGoalTypeSchema,
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priority_event: z.string().nullable().optional(),
  status: CareerGoalStatusSchema
});

export const DevelopmentPlanFormSchema = z.object({
  athlete_id: z.string().uuid(),
  coach_id: z.string().uuid(),
  plan_period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  plan_period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  goals: z.array(z.record(z.unknown())),
  periodization_blocks: z.array(
    z.object({
      block_name: z.string(),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      focus_areas: z.array(z.string()),
      volume_target: z.number().positive()
    })
  )
});

export const IncomeRecordFormSchema = z.object({
  athlete_id: z.string().uuid(),
  source_type: IncomeSourceTypeSchema,
  amount: z.string().min(1),
  currency: z.string().default("INR"),
  received_at: z.string().datetime({ offset: true }).or(z.string().datetime()),
  fiscal_year: z.string().min(4),
  notes: z.string().nullable().optional(),
  verified: z.boolean()
});

export const GrantRecordFormSchema = z.object({
  athlete_id: z.string().uuid(),
  grant_scheme: GrantSchemeSchema,
  amount: z.string().min(1),
  disbursed_at: z.string().datetime({ offset: true }).or(z.string().datetime()),
  next_disbursement_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  conditions: z.string().nullable().optional()
});

export const NotificationPreferenceFormSchema = z.object({
  notification_type: z.string().min(1),
  channels: z.array(NotificationChannelSchema),
  in_app_enabled: z.boolean(),
  email_enabled: z.boolean(),
  push_enabled: z.boolean()
});

export const FileUploadFormSchema = z.object({
  athlete_id: z.string().uuid(),
  file_type: FileTypeSchema,
  filename: z.string().min(1),
  mime_type: z.string().min(1),
  size_bytes: z.number().int().positive(),
  access_level: FileAccessLevelSchema
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;
export type RegisterFormValues = z.infer<typeof RegisterFormSchema>;
export type AthleteFormValues = z.infer<typeof AthleteFormSchema>;
export type SportFormValues = z.infer<typeof SportFormSchema>;
export type SessionLogFormValues = z.infer<typeof SessionLogFormSchema>;
export type InjuryRecordFormValues = z.infer<typeof InjuryRecordFormSchema>;
export type CareerGoalFormValues = z.infer<typeof CareerGoalFormSchema>;
export type DevelopmentPlanFormValues = z.infer<typeof DevelopmentPlanFormSchema>;
export type IncomeRecordFormValues = z.infer<typeof IncomeRecordFormSchema>;
export type GrantRecordFormValues = z.infer<typeof GrantRecordFormSchema>;
export type NotificationPreferenceFormValues = z.infer<typeof NotificationPreferenceFormSchema>;
export type FileUploadFormValues = z.infer<typeof FileUploadFormSchema>;
