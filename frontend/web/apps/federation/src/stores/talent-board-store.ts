"use client";

import { create } from "zustand";

import { talentBoard, type TalentBoardAthlete, type TalentBoardTier } from "@/lib/mock-data";
import { moveTalentAthleteTier } from "@/lib/utils";

type TalentBoardStore = {
  athletesByTier: TalentBoardAthlete[];
  moveAthlete: (athleteId: string, tier: TalentBoardTier) => void;
};

export const useTalentBoardStore = create<TalentBoardStore>((set) => ({
  athletesByTier: talentBoard,
  moveAthlete: (athleteId, tier) =>
    set((state) => ({
      athletesByTier: moveTalentAthleteTier(state.athletesByTier, athleteId, tier)
    }))
}));
