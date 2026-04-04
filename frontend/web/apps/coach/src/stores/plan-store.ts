"use client";

import { create } from "zustand";

import type { PlanBlock } from "@/lib/mock-data";
import { validatePlanOverlap } from "@/lib/utils";

type PlanStore = {
  draftPlan: PlanBlock[];
  addBlock: (block: PlanBlock) => void;
  removeBlock: (id: string) => void;
  updateBlocks: (blocks: PlanBlock[]) => void;
  validatePlan: () => string[];
};

export const usePlanStore = create<PlanStore>((set, get) => ({
  draftPlan: [],
  addBlock: (block) => set((state) => ({ draftPlan: [...state.draftPlan, block] })),
  removeBlock: (id) => set((state) => ({ draftPlan: state.draftPlan.filter((block) => block.id !== id) })),
  updateBlocks: (blocks) => set({ draftPlan: blocks }),
  validatePlan: () => validatePlanOverlap(get().draftPlan)
}));
