import type { QueryClient } from "@tanstack/react-query";

import { useSessionStore } from "../stores";

export const queryKeys = {
  athleteProfile: ["athlete", "profile"] as const,
  sessions: ["sessions", "recent"] as const,
  riskScore: ["injury", "risk"] as const,
  dashboard: ["dashboard"] as const
};

export const cachePolicies = {
  athleteProfile: 1000 * 60 * 60 * 24,
  sessions: 1000 * 60 * 60,
  riskScore: 1000 * 60 * 30
} as const;

export const queueSessionForOffline = useSessionStore.getState().queueSession;

export const syncOfflineSessions = async (queryClient?: QueryClient) => {
  const synced = await useSessionStore.getState().syncPending();
  if (synced > 0 && queryClient) {
    await queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  }
  return synced;
};
