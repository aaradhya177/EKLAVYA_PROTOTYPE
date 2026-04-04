import { getClient } from "../client";
import type { Notification, NotificationPreference } from "../../types";
import type { PaginatedResponse } from "../types";

export const getNotifications = async (params: Record<string, string | number | undefined>): Promise<PaginatedResponse<Notification>> =>
  (await getClient().get<PaginatedResponse<Notification>>("/notifications", { params })).data;
export const getUnreadCount = async (): Promise<number> => (await getClient().get<number>("/notifications/unread-count")).data;
export const markRead = async (id: string): Promise<void> => {
  await getClient().post(`/notifications/${id}/read`);
};
export const markAllRead = async (): Promise<void> => {
  await getClient().post("/notifications/read-all");
};
export const getPreferences = async (): Promise<NotificationPreference[]> =>
  (await getClient().get<NotificationPreference[]>("/notifications/preferences")).data;
export const updatePreferences = async (data: NotificationPreference[]): Promise<NotificationPreference[]> =>
  (await getClient().put<NotificationPreference[]>("/notifications/preferences", data)).data;
export const registerDevice = async (token: string, platform: "ios" | "android" | "web"): Promise<void> => {
  await getClient().post("/notifications/devices", { token, platform });
};
