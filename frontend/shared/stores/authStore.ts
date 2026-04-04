import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { AuthTokens, AuthUser } from "../api/types";
import { runtimeBridge } from "./runtime";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (payload: { user: AuthUser; tokens: AuthTokens }) => void;
  logout: () => void;
  setTokens: (tokens: AuthTokens) => void;
  refreshTokens: (tokens: AuthTokens) => void;
  setUser: (user: AuthUser | null) => void;
  setHydrated: (value: boolean) => void;
};

const createStorage = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return AsyncStorage;
};

const encode = (value: string) => {
  if (typeof window !== "undefined" && "btoa" in window) {
    return window.btoa(value);
  }
  return value;
};

const decode = (value: string) => {
  if (typeof window !== "undefined" && "atob" in window) {
    return window.atob(value);
  }
  return value;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hydrated: false,
      login: ({ user, tokens }) =>
        set({
          user,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isAuthenticated: true
        }),
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        });
        runtimeBridge.redirectToLogin();
      },
      setTokens: (tokens) =>
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isAuthenticated: true
        }),
      refreshTokens: (tokens) =>
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isAuthenticated: true
        }),
      setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
      setHydrated: (value) => set({ hydrated: value })
    }),
    {
      name: "athleteos.shared.auth",
      storage: createJSONStorage(() => createStorage()),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken ? encode(state.accessToken) : null,
        refreshToken: state.refreshToken ? encode(state.refreshToken) : null,
        isAuthenticated: state.isAuthenticated
      }),
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<AuthState> | undefined;
        return {
          ...currentState,
          ...state,
          accessToken: state?.accessToken ? decode(state.accessToken) : null,
          refreshToken: state?.refreshToken ? decode(state.refreshToken) : null
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);
