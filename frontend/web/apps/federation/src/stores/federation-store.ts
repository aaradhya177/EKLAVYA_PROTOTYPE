"use client";

import { create } from "zustand";

import { federationProfile } from "@/lib/mock-data";

type FederationStore = {
  profile: typeof federationProfile;
  selectedState: string | null;
  selectedSport: string | null;
  setSelectedState: (state: string | null) => void;
  setSelectedSport: (sport: string | null) => void;
};

export const useFederationStore = create<FederationStore>((set) => ({
  profile: federationProfile,
  selectedState: null,
  selectedSport: null,
  setSelectedState: (state) => set({ selectedState: state }),
  setSelectedSport: (sport) => set({ selectedSport: sport })
}));
