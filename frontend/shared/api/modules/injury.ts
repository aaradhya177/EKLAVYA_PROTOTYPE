import { getClient } from "../client";
import type { InjuryRecord, RiskScore } from "../../types";
import type { RiskAlert, SHAPFactor } from "../types";

export const getRiskScore = async (athleteId: string): Promise<RiskScore> => (await getClient().get<RiskScore>(`/injury/athletes/${athleteId}/risk`)).data;
export const getRiskExplanation = async (athleteId: string): Promise<SHAPFactor[]> => (await getClient().get<SHAPFactor[]>(`/injury/athletes/${athleteId}/explanation`)).data;
export const getInjuryHistory = async (athleteId: string): Promise<InjuryRecord[]> => (await getClient().get<InjuryRecord[]>(`/injury/athletes/${athleteId}/history`)).data;
export const logInjury = async (data: Omit<InjuryRecord, "id">): Promise<InjuryRecord> => (await getClient().post<InjuryRecord>("/injury/log", data)).data;
export const getAllAlerts = async (): Promise<RiskAlert[]> => (await getClient().get<RiskAlert[]>("/injury/alerts")).data;
