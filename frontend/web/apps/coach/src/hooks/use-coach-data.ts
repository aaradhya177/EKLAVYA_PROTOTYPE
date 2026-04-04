"use client";

import { useQuery } from "@tanstack/react-query";

import { coachApi } from "@/lib/api";

export const useOverviewQuery = () =>
  useQuery({
    queryKey: ["coach", "overview"],
    queryFn: coachApi.getOverview
  });

export const useAthletesQuery = () =>
  useQuery({
    queryKey: ["coach", "athletes"],
    queryFn: coachApi.getAthletes
  });

export const useAthleteDetailQuery = (id: string) =>
  useQuery({
    queryKey: ["coach", "athlete", id],
    queryFn: () => coachApi.getAthleteDetail(id)
  });

export const useAlertsQuery = () =>
  useQuery({
    queryKey: ["coach", "alerts"],
    queryFn: coachApi.getAlerts,
    refetchInterval: 60_000
  });

export const useFilesQuery = () =>
  useQuery({
    queryKey: ["coach", "files"],
    queryFn: coachApi.getFiles
  });
