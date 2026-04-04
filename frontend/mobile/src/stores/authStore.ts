import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AuthSession, AuthTokens, AuthUser } from "../shared";

import { apiClient } from "../lib/api";
import { storageKeys } from "../lib/storage";

type AuthStore = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  login: (email: string, password: string) => Promise<AuthSession>;
  register: (name: string, email: string, password: string) => Promise<AuthSession>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<AuthTokens | null>;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      login: async (email, password) => {
        const session = await apiClient.login(email, password);
        set({ user: session.user, tokens: session.tokens });
        return session;
      },
      register: async (name, email, password) => {
        const session = await apiClient.register(name, email);
        set({ user: session.user, tokens: session.tokens });
        return session;
      },
      logout: async () => {
        set({ user: null, tokens: null });
      },
      refreshToken: async () => {
        const tokens = get().tokens;
        if (!tokens) {
          return null;
        }
        const refreshed = { ...tokens, access_token: `${tokens.access_token}-refreshed` };
        set({ tokens: refreshed });
        return refreshed;
      }
    }),
    {
      name: storageKeys.auth,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);
