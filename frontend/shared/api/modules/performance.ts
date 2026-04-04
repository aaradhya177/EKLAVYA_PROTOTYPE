import { getClient } from "../client";
import type { PerformanceIndex, SessionLog } from "../../types";
import type { Alert, PaginatedResponse, TrendPoint } from "../types";

export const logSession = async (data: Omit<SessionLog, "id">): Promise<SessionLog> => (await getClient().post<SessionLog>("/performance/sessions", data)).data;
export const getSessions = async (athleteId: string, params: Record<string, string | number | undefined>): Promise<PaginatedResponse<SessionLog>> =>
  (await getClient().get<PaginatedResponse<SessionLog>>(`/performance/athletes/${athleteId}/sessions`, { params })).data;
export const getPerformanceSummary = async (athleteId: string): Promise<PerformanceIndex[]> =>
  (await getClient().get<PerformanceIndex[]>(`/performance/athletes/${athleteId}/summary`)).data;
export const getPerformanceTrend = async (athleteId: string, indexName: string, from: string, to: string): Promise<TrendPoint[]> =>
  (await getClient().get<TrendPoint[]>(`/performance/athletes/${athleteId}/trend`, { params: { indexName, from, to } })).data;
export const getPerformanceAlerts = async (athleteId: string): Promise<Alert[]> =>
  (await getClient().get<Alert[]>(`/performance/athletes/${athleteId}/alerts`)).data;
