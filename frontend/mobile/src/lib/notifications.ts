import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

import { apiClient } from "./api";
import { storageKeys } from "./storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

const routeForNotification = (type: string) => {
  if (type === "INJURY_RISK_CRITICAL") {
    return "/(app)/injury";
  }
  if (type === "ACWR_ALERT") {
    return "/(app)/performance";
  }
  if (type === "GRANT_DEADLINE") {
    return "/(app)/financial/grants";
  }
  return "/(app)/notifications";
};

export const requestPushPermission = async () => {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

export const registerPushToken = async () => {
  const granted = await requestPushPermission();
  if (!granted) {
    return null;
  }
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await apiClient.registerPushToken(token);
  await AsyncStorage.setItem(storageKeys.notificationsToken, token);
  return token;
};

export const bindNotificationNavigation = () =>
  Notifications.addNotificationResponseReceivedListener((response) => {
    const type = String(response.notification.request.content.data?.type ?? "");
    router.push(routeForNotification(type));
  });
