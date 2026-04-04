import React, { useState } from "react";
import { Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../../src/components/Screen";
import { SharedComponents } from "../../../src/shared";

export default function ConsentScreen() {
  const { t } = useTranslation();
  const [health, setHealth] = useState(true);
  const [financial, setFinancial] = useState(true);
  const [performance, setPerformance] = useState(true);

  return (
    <Screen>
      <SharedComponents.Card variant="elevated">
        <Text className="text-2xl font-bold text-[#2C2C2A]">{t("profile.consent")}</Text>
      </SharedComponents.Card>

      <SharedComponents.Card>
        <View style={{ gap: 16 }}>
          <Text className="text-sm text-[#5F5E5A]">{t("consent.dpdp")}</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-[#2C2C2A]">{t("consent.health")}</Text>
            <Switch value={health} onValueChange={setHealth} />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-[#2C2C2A]">{t("consent.financial")}</Text>
            <Switch value={financial} onValueChange={setFinancial} />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-[#2C2C2A]">{t("consent.performance")}</Text>
            <Switch value={performance} onValueChange={setPerformance} />
          </View>
        </View>
      </SharedComponents.Card>
    </Screen>
  );
}
