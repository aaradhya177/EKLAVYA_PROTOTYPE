import * as Sentry from "@sentry/browser";
import axios, { AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { v4 as uuidv4 } from "uuid";

import type { APIResponse, AuthTokens } from "./types";
import { runtimeBridge, useAuthStore } from "../stores";

const resolveBaseUrl = () => {
  if (typeof process !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
  }
  return "http://localhost:8000";
};

let refreshPromise: Promise<AuthTokens | null> | null = null;

const retryWithDelay = async (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  const state = useAuthStore.getState();
  const headers = config.headers;
  if (state.accessToken) {
    headers.set("Authorization", `Bearer ${state.accessToken}`);
  }
  headers.set("X-Request-ID", uuidv4());
  headers.set("Accept-Language", runtimeBridge.getLanguage());
  return config;
};

const unwrapEnvelope = <T>(response: AxiosResponse<APIResponse<T> | T>) => {
  const data = response.data;
  if (data && typeof data === "object" && "status" in data && "data" in data) {
    return data.data;
  }
  return data;
};

const refreshTokens = async (instance: AxiosInstance): Promise<AuthTokens | null> => {
  const state = useAuthStore.getState();
  if (!state.refreshToken) {
    return null;
  }
  try {
    const response = await instance.post<APIResponse<AuthTokens> | AuthTokens>("/auth/refresh", {
      refresh_token: state.refreshToken
    });
    const tokens = unwrapEnvelope<AuthTokens>(response as AxiosResponse<APIResponse<AuthTokens>>);
    useAuthStore.getState().refreshTokens(tokens);
    return tokens;
  } catch {
    return null;
  }
};

const errorInterceptor = async (error: AxiosError) => {
  const { response, config } = error;
  if (!response || !config) {
    runtimeBridge.showToast({ title: "Something went wrong", variant: "error" });
    Sentry.captureException(error);
    return Promise.reject(error);
  }

  if (response.status === 401 && !(config as InternalAxiosRequestConfig & { _retry?: boolean })._retry) {
    (config as InternalAxiosRequestConfig & { _retry?: boolean })._retry = true;
    if (!refreshPromise) {
      refreshPromise = refreshTokens(client).finally(() => {
        refreshPromise = null;
      });
    }
    const tokens = await refreshPromise;
    if (!tokens) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }
    config.headers.set("Authorization", `Bearer ${tokens.access_token}`);
    return client(config);
  }

  if (response.status === 451) {
    runtimeBridge.showConsentRequired();
    return Promise.reject(error);
  }

  if (response.status === 429) {
    runtimeBridge.showToast({ title: "Too many requests", variant: "warning" });
    const retryAfter = Number(response.headers["retry-after"] ?? "1");
    await retryWithDelay(Math.max(retryAfter, 1) * 1000);
    return client(config);
  }

  if (response.status >= 500) {
    runtimeBridge.showToast({ title: "Something went wrong", variant: "error" });
    Sentry.captureException(error);
  }

  return Promise.reject(error);
};

export const client = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000
});

client.interceptors.request.use(requestInterceptor);
client.interceptors.response.use((response) => {
  response.data = unwrapEnvelope(response as AxiosResponse<APIResponse<unknown>>) as never;
  return response;
}, errorInterceptor);

export const getClient = () => client;
