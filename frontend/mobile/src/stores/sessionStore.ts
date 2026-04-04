import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import type { SessionLog } from "../shared";

import { apiClient } from "../lib/api";
import { storageKeys } from "../lib/storage";

export type PendingOfflineSession = SessionLog & {
  queuedAt: string;
};

type SessionStore = {
  pendingOfflineSessions: PendingOfflineSession[];
  hydrateQueue: () => Promise<void>;
  queueSession: (session: SessionLog) => Promise<void>;
  syncPending: () => Promise<number>;
};

const persistQueue = async (sessions: PendingOfflineSession[]) => {
  await AsyncStorage.setItem(storageKeys.offlineSessions, JSON.stringify(sessions));
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  pendingOfflineSessions: [],
  hydrateQueue: async () => {
    const raw = await AsyncStorage.getItem(storageKeys.offlineSessions);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as PendingOfflineSession[];
    set({ pendingOfflineSessions: parsed });
  },
  queueSession: async (session) => {
    const pending = [...get().pendingOfflineSessions, { ...session, queuedAt: new Date().toISOString() }];
    set({ pendingOfflineSessions: pending });
    await persistQueue(pending);
  },
  syncPending: async () => {
    const pending = [...get().pendingOfflineSessions];
    for (const session of pending) {
      await apiClient.saveSession(session);
    }
    set({ pendingOfflineSessions: [] });
    await AsyncStorage.removeItem(storageKeys.offlineSessions);
    return pending.length;
  }
}));
