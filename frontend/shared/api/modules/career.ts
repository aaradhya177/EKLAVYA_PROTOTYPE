import { getClient } from "../client";
import type { CareerGoal, DevelopmentPlan, TalentSignal } from "../../types";
import type { CareerMilestone } from "../types";

export const getGoals = async (athleteId: string): Promise<CareerGoal[]> => (await getClient().get<CareerGoal[]>(`/career/athletes/${athleteId}/goals`)).data;
export const setGoal = async (data: Omit<CareerGoal, "id" | "created_at">): Promise<CareerGoal> => (await getClient().post<CareerGoal>("/career/goals", data)).data;
export const getPlan = async (athleteId: string): Promise<DevelopmentPlan> => (await getClient().get<DevelopmentPlan>(`/career/athletes/${athleteId}/plan`)).data;
export const createPlan = async (data: Omit<DevelopmentPlan, "id" | "created_at" | "updated_at">): Promise<DevelopmentPlan> =>
  (await getClient().post<DevelopmentPlan>("/career/plans", data)).data;
export const getMilestones = async (athleteId: string): Promise<CareerMilestone[]> => (await getClient().get<CareerMilestone[]>(`/career/athletes/${athleteId}/milestones`)).data;
export const getTalentSignal = async (athleteId: string): Promise<TalentSignal> => (await getClient().get<TalentSignal>(`/career/athletes/${athleteId}/talent-signal`)).data;
