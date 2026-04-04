import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import { apiClient } from "../lib/api";
import { cachePolicies, queryKeys } from "../lib/offline";

export const useDashboardQuery = () =>
  useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: apiClient.getDashboard
  });

export const usePerformanceQuery = () =>
  useQuery({
    queryKey: queryKeys.sessions,
    queryFn: apiClient.getPerformance,
    staleTime: cachePolicies.sessions
  });

export const useInjuryQuery = () =>
  useQuery({
    queryKey: queryKeys.riskScore,
    queryFn: apiClient.getInjuryOverview,
    staleTime: cachePolicies.riskScore
  });

export const useCareerQuery = () =>
  useQuery({
    queryKey: ["career", "overview"],
    queryFn: apiClient.getCareerOverview
  });

export const useFinancialQuery = () =>
  useQuery({
    queryKey: ["financial", "overview"],
    queryFn: apiClient.getFinancialOverview
  });

export const useNotificationsQuery = () =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: apiClient.getNotifications
  });

export const useSessionHistoryInfiniteQuery = () =>
  useInfiniteQuery({
    queryKey: ["sessions", "history"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.getPerformance();
      return {
        items: response.sessions.slice(pageParam * 10, pageParam * 10 + 10),
        nextPage: response.sessions.length > (pageParam + 1) * 10 ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage
  });

export const useLoginMutation = () =>
  useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => apiClient.login(email, password)
  });
