import * as Network from "expo-network";
import { create } from "zustand";

type NetworkStore = {
  isOnline: boolean;
  checkedAt: string | null;
  refresh: () => Promise<boolean>;
  setOnline: (value: boolean) => void;
};

export const useNetworkStore = create<NetworkStore>((set) => ({
  isOnline: true,
  checkedAt: null,
  setOnline: (value) => set({ isOnline: value, checkedAt: new Date().toISOString() }),
  refresh: async () => {
    const state = await Network.getNetworkStateAsync();
    const online = Boolean(state.isConnected && state.isInternetReachable !== false);
    set({ isOnline: online, checkedAt: new Date().toISOString() });
    return online;
  }
}));
