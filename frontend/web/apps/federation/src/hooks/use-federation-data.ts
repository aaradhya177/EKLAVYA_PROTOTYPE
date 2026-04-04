"use client";

import { useQuery } from "@tanstack/react-query";

import { federationApi } from "@/lib/api";

export const useOverviewQuery = () =>
  useQuery({
    queryKey: ["federation", "overview"],
    queryFn: federationApi.getOverview
  });

export const useAthletesQuery = () =>
  useQuery({
    queryKey: ["federation", "athletes"],
    queryFn: federationApi.getAthletes
  });

export const useAthleteDetailQuery = (id: string) =>
  useQuery({
    queryKey: ["federation", "athlete", id],
    queryFn: () => federationApi.getAthleteDetail(id)
  });

export const useTalentBoardQuery = () =>
  useQuery({
    queryKey: ["federation", "talent-board"],
    queryFn: federationApi.getTalentBoard
  });

export const useSportAnalyticsQuery = () =>
  useQuery({
    queryKey: ["federation", "sports"],
    queryFn: federationApi.getSportAnalytics
  });

export const useSportDetailQuery = (sportId: string) =>
  useQuery({
    queryKey: ["federation", "sport", sportId],
    queryFn: () => federationApi.getSportDetail(sportId)
  });

export const useGrantsQuery = () =>
  useQuery({
    queryKey: ["federation", "grants"],
    queryFn: federationApi.getGrants
  });

export const useReportsQuery = () =>
  useQuery({
    queryKey: ["federation", "reports"],
    queryFn: federationApi.getReports
  });

export const useComplianceQuery = () =>
  useQuery({
    queryKey: ["federation", "compliance"],
    queryFn: federationApi.getCompliance
  });
