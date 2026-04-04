import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useNetworkStore } from "../lib/network";

export function OfflineBanner() {
  const isOnline = useNetworkStore((state) => state.isOnline);
  const { t } = useTranslation();

  if (isOnline) {
    return null;
  }

  return (
    <View className="rounded-2xl border border-[#BA7517] bg-[#FAEEDA] px-4 py-3">
      <Text className="text-[13px] font-semibold text-[#854F0B]">{t("common.offline")}</Text>
    </View>
  );
}
