import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../../src/components/Screen";
import { usePerformanceQuery } from "../../../src/hooks/useAthleteQueries";
import { SharedComponents } from "../../../src/shared";

export default function SessionDetailScreen() {
  const { t } = useTranslation();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const query = usePerformanceQuery();

  const session = query.data?.sessions.find((item) => String(item.id) === sessionId);

  if (!session) {
    return (
      <Screen>
        <Text>{t("common.loading")}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <SharedComponents.Card variant="elevated">
        <View style={{ gap: 8 }}>
          <Text className="text-2xl font-bold text-[#2C2C2A]">Session #{session.id}</Text>
          <SharedComponents.Badge label={session.session_type} variant="info" />
          <Text className="text-sm text-[#5F5E5A]">{session.start_time}</Text>
          <Text className="text-sm text-[#5F5E5A]">{session.end_time ?? session.start_time}</Text>
        </View>
      </SharedComponents.Card>

      <SharedComponents.Card>
        <View style={{ gap: 12 }}>
          <SharedComponents.MetricTile label="RPE" value={session.rpe ?? "-"} />
          <SharedComponents.MetricTile label="Distance" value={String(session.raw_metrics.distance ?? "-")} unit="km" />
          <SharedComponents.MetricTile label="Average HR" value={String(session.raw_metrics.avg_hr ?? "-")} unit="bpm" />
          <SharedComponents.MetricTile label="Max HR" value={String(session.raw_metrics.max_hr ?? "-")} unit="bpm" />
        </View>
      </SharedComponents.Card>

      <SharedComponents.Card variant="outlined">
        <Text className="text-sm text-[#444441]">{session.notes ?? "-"}</Text>
      </SharedComponents.Card>
    </Screen>
  );
}
