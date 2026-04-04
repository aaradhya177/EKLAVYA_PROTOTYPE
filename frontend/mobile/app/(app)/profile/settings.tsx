import { router } from "expo-router";
import React from "react";
import { Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { LanguageSelector } from "../../../src/components/LanguageSelector";
import { Screen } from "../../../src/components/Screen";
import { useNotificationStore, useAuthStore } from "../../../src/stores";
import { SharedComponents } from "../../../src/shared";
import { env } from "../../../src/constants/env";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const logout = useAuthStore((state) => state.logout);

  return (
    <Screen>
      <SharedComponents.Card variant="elevated">
        <Text className="text-2xl font-bold text-[#2C2C2A]">{t("profile.settings")}</Text>
      </SharedComponents.Card>

      <LanguageSelector />

      <SharedComponents.Card>
        <View style={{ gap: 14 }}>
          <Text className="text-lg font-semibold text-[#2C2C2A]">{t("settings.preferences")}</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-[#444441]">Risk alerts</Text>
            <Switch value />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-[#444441]">Grant reminders</Text>
            <Switch value={unreadCount >= 0} />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-[#444441]">Training summaries</Text>
            <Switch value />
          </View>
        </View>
      </SharedComponents.Card>

      <SharedComponents.Card variant="outlined">
        <View style={{ gap: 8 }}>
          <Text className="text-sm text-[#5F5E5A]">{t("settings.version")}</Text>
          <Text className="text-base font-semibold text-[#2C2C2A]">{env.appVersion}</Text>
        </View>
      </SharedComponents.Card>

      <SharedComponents.Button
        label={t("common.logout")}
        variant="danger"
        onPress={() => {
          void logout();
          router.replace("/(auth)/login");
        }}
      />
    </Screen>
  );
}
