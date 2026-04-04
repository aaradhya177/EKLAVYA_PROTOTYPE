import { create } from "zustand";

import type { Notification } from "../shared";

type NotificationStore = {
  items: Notification[];
  unreadCount: number;
  setNotifications: (items: Notification[]) => void;
  markRead: (id: string) => void;
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  items: [],
  unreadCount: 0,
  setNotifications: (items) =>
    set({
      items,
      unreadCount: items.filter((item) => !item.is_read).length
    }),
  markRead: (id) => {
    const updated = get().items.map((item) => (item.id === id ? { ...item, is_read: true } : item));
    set({
      items: updated,
      unreadCount: updated.filter((item) => !item.is_read).length
    });
  }
}));
