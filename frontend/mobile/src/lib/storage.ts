import AsyncStorage from "@react-native-async-storage/async-storage";

export const storageKeys = {
  auth: "athleteos.auth",
  language: "athleteos.language",
  offlineSessions: "athleteos.offline.sessions",
  notificationsToken: "athleteos.push.token"
} as const;

export const storage = {
  getItem: async (key: string) => AsyncStorage.getItem(key),
  setItem: async (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: async (key: string) => AsyncStorage.removeItem(key)
};
