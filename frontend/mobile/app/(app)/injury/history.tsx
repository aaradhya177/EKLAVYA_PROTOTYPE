import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../../src/components/Screen";
import { TimelineItem } from "../../../src/components/TimelineItem";
import { useInjuryQuery } from "../../../src/hooks/useAthleteQueries";
import { SharedComponents } from "../../../src/shared";

export default function InjuryHistoryScreen() {
  const { t } = useTranslation();
  const query = useInjuryQuery();

  return (
    <Screen>
      <SharedComponents.Card variant="elevated">
        <Text className="text-2xl font-bold text-[#2C2C2A]">{t("injury.history")}</Text>
      </SharedComponents.Card>
      <View style={{ gap: 12 }}>
        {query.data?.injuryHistory.map((injury) => (
          <TimelineItem
            key={injury.id}
            title={`${injury.body_part} · ${injury.severity}`}
            subtitle={`${injury.occurred_at} → ${injury.returned_at ?? "ongoing"}`}
            active
          />
        ))}
      </View>
    </Screen>
  );
}
