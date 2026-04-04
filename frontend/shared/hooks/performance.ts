import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getPerformanceSummary,
  getSessions,
  logSession
} from "../api/modules/performance";

import { handleMutationError, handleMutationSuccess } from "./helpers";

export const performanceKeys = {
  all: ["performance"] as const,
  summary: (athleteId: string) => [...performanceKeys.all, "summary", athleteId] as const,
  sessions: (athleteId: string, params?: Record<string, unknown>) =>
    [...performanceKeys.all, "sessions", athleteId, params ?? {}] as const
};

export const useSessions = (athleteId: string, params?: Record<string, unknown>) =>
  useInfiniteQuery({
    queryKey: performanceKeys.sessions(athleteId, params),
    queryFn: ({ pageParam = 1 }) =>
      getSessions(athleteId, {
        ...params,
        page: pageParam
      }),
    initialPageParam: 1,
    enabled: Boolean(athleteId),
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage <= Math.ceil(lastPage.total / lastPage.per_page) ? nextPage : undefined;
    }
  });

export const usePerformanceSummary = (athleteId: string) =>
  useQuery({
    queryKey: performanceKeys.summary(athleteId),
    queryFn: () => getPerformanceSummary(athleteId),
    enabled: Boolean(athleteId),
    staleTime: 1000 * 60 * 10
  });

export const useLogSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logSession,
    onSuccess: async (session) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: performanceKeys.sessions(session.athlete_id)
        }),
        queryClient.invalidateQueries({
          queryKey: performanceKeys.summary(session.athlete_id)
        })
      ]);
      handleMutationSuccess("Session logged successfully");
    },
    onError: () => {
      handleMutationError("Unable to log session");
    }
  });
};
