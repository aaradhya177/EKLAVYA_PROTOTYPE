import Constants from "expo-constants";

const expoExtra = Constants.expoConfig?.extra ?? {};

export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? (expoExtra.apiBaseUrl as string | undefined) ?? "http://localhost:8000",
  appVersion: Constants.expoConfig?.version ?? "1.0.0"
} as const;
