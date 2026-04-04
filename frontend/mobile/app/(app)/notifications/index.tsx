import React, { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";

import { FilterTabs } from "../../../src/components/FilterTabs";
import { Screen } from "../../../src/components/Screen";
import { useNotificationsQuery } from "../../../src/hooks/useAthleteQueries";
import { useNotificationStore } from "../../../src/stores";
import { SharedComponents, formatDate } from "../../../src/shared";

const filters = ["All", "Unread", "Alerts", "Reminders"] as const;

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const query = useNotificationsQuery();
  const items = useNotificationStore((state) => state.items);
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");

  useEffect(() => {
    if (query.data) {
      setNotifications(query.data);
    }
  }, [query.data, setNotifications]);

  const filtered = useMemo(() => {
    if (activeFilter === "Unread") {
      return items.filter((item) => !item.is_read);
    }
    if (activeFilter === "Alerts") {
      return items.filter((item) => item.priority === "critical" || item.priority === "high");
    }
    if (activeFilter === "Reminders") {
      return items.filter((item) => item.notification_type.includes("GRANT"));
    }
    return items;
  }, [activeFilter, items]);

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    const key = formatDate(item.created_at);
    acc[key] = [...(acc[key] ?? []), item];
    return acc;
  }, {});

  return (
    <Screen>
      <SharedComponents.Card variant="elevated">
        <View style={{ gap: 12 }}>
          <Text className="text-2xl font-bold text-[#2C2C2A]">{t("notifications.title")}</Text>
          <FilterTabs options={filters} value={activeFilter} onChange={setActiveFilter} />
        </View>
      </SharedComponents.Card>
      {Object.entries(grouped).map(([date, group]) => (
        <View key={date} style={{ gap: 8 }}>
          <Text className="text-sm font-semibold text-[#5F5E5A]">{date}</Text>
          {group.map((item) => (
            <Swipeable
              key={item.id}
              renderRightActions={() => (
                <View className="items-center justify-center rounded-r-2xl bg-[#E1F5EE] px-4">
                  <Text className="text-xs font-semibold text-[#0F6E56]">Read</Text>
                </View>
              )}
              onSwipeableOpen={() => markRead(item.id)}
            >
              <View className={`rounded-2xl bg-white px-4 py-4 ${item.is_read ? "" : "border-l-4 border-l-[#534AB7]"}`}>
                <Text className="text-sm font-semibold text-[#2C2C2A]">{item.title}</Text>
                <Text className="mt-1 text-xs text-[#5F5E5A]">{item.body}</Text>
              </View>
            </Swipeable>
          ))}
        </View>
      ))}
    </Screen>
  );
}
