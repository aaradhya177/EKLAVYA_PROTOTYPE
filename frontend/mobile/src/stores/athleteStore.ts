import { create } from "zustand";

import type { Athlete, Sport } from "../shared";

type AthleteStore = {
  profile: Athlete | null;
  sport: Sport | null;
  tier: Athlete["tier"] | null;
  setProfile: (profile: Athlete) => void;
  setSport: (sport: Sport) => void;
};

export const useAthleteStore = create<AthleteStore>((set) => ({
  profile: null,
  sport: null,
  tier: null,
  setProfile: (profile) => set({ profile, tier: profile.tier }),
  setSport: (sport) => set({ sport })
}));
