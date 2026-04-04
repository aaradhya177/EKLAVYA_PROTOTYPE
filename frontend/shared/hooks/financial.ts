import { useQuery } from "@tanstack/react-query";

import { getSummary } from "../api/modules/financial";

export const financialKeys = {
  all: ["financial"] as const,
  summary: (athleteId: string, year: string) =>
    [...financialKeys.all, "summary", athleteId, year] as const
};

export const useFinancialSummary = (athleteId: string, year: string) =>
  useQuery({
    queryKey: financialKeys.summary(athleteId, year),
    queryFn: () => getSummary(athleteId, year),
    enabled: Boolean(athleteId && year),
    staleTime: 1000 * 60 * 30
  });
