import { useQuery } from "@tanstack/react-query";

import { getAllAlerts, getRiskExplanation, getRiskScore } from "../api/modules/injury";

export const injuryKeys = {
  all: ["injury"] as const,
  riskScore: (athleteId: string) => [...injuryKeys.all, "risk-score", athleteId] as const,
  explanation: (athleteId: string) => [...injuryKeys.all, "explanation", athleteId] as const,
  alerts: () => [...injuryKeys.all, "alerts"] as const
};

export const useRiskScore = (athleteId: string) =>
  useQuery({
    queryKey: injuryKeys.riskScore(athleteId),
    queryFn: () => getRiskScore(athleteId),
    enabled: Boolean(athleteId),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60
  });

export const useRiskExplanation = (athleteId: string) =>
  useQuery({
    queryKey: injuryKeys.explanation(athleteId),
    queryFn: () => getRiskExplanation(athleteId),
    enabled: Boolean(athleteId),
    staleTime: 1000 * 60 * 30
  });

export const useAllAlerts = () =>
  useQuery({
    queryKey: injuryKeys.alerts(),
    queryFn: getAllAlerts,
    refetchInterval: 1000 * 60
  });
