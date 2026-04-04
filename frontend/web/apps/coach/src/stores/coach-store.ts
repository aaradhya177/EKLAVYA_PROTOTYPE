"use client";

import { create } from "zustand";

import type { Athlete } from "../../../../shared/types";

import { athletes, coachProfile } from "@/lib/mock-data";

type CoachStore = {
  profile: typeof coachProfile;
  assignedAthletes: Athlete[];
  selectedAthleteId: string | null;
  setSelectedAthleteId: (id: string | null) => void;
};

export const useCoachStore = create<CoachStore>((set) => ({
  profile: coachProfile,
  assignedAthletes: athletes,
  selectedAthleteId: athletes[0]?.id ?? null,
  setSelectedAthleteId: (id) => set({ selectedAthleteId: id })
}));
