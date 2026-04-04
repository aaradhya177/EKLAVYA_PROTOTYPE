import { getClient } from "../client";
import type { Athlete } from "../../types";
import type { EventLog, FeatureSnapshot } from "../types";

export const getAthlete = async (id: string): Promise<Athlete> => (await getClient().get<Athlete>(`/athletes/${id}`)).data;
export const updateAthlete = async (id: string, data: Partial<Athlete>): Promise<Athlete> => (await getClient().patch<Athlete>(`/athletes/${id}`, data)).data;
export const ingestEvent = async (athleteId: string, event: Omit<EventLog, "id" | "athlete_id" | "recorded_at">): Promise<EventLog> =>
  (await getClient().post<EventLog>(`/athletes/${athleteId}/events`, event)).data;
export const getFeatures = async (athleteId: string): Promise<FeatureSnapshot[]> =>
  (await getClient().get<FeatureSnapshot[]>(`/athletes/${athleteId}/features`)).data;
