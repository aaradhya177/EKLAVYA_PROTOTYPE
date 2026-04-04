import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { FilterTabs } from "../../../src/components/FilterTabs";
import { LastUpdatedLabel } from "../../../src/components/LastUpdatedLabel";
import { OfflineBanner } from "../../../src/components/OfflineBanner";
import { SectionHeader } from "../../../src/components/SectionHeader";
import { usePerformanceQuery, useSessionHistoryInfiniteQuery } from "../../../src/hooks/useAthleteQueries";
import { SharedCharts, SharedComponents } from "../../../src/shared";

const dateRanges = ["7d", "30d", "90d"] as const;
const sessionTypes = ["all", "training", "competition", "recovery"] as const;

export default function PerformanceScreen() {
  const { t } = useTranslation();
  const query = usePerformanceQuery();
  const historyQuery = useSessionHistoryInfiniteQuery();
  const [selectedType, setSelectedType] = useState<(typeof sessionTypes)[number]>("all");
  const [selectedRange, setSelectedRange] = useState<(typeof dateRanges)[number]>("30d");

  if (!query.data) {
    return <View className="flex-1 items-center justify-center"><Text>{t("common.loading")}</Text></View>;
  }

  const filteredSessions = useMemo(
    () => query.data.sessions.filter((session) => selectedType === "all" || session.session_type === selectedType),
    [query.data.sessions, selectedType]
  );
  const weekData = [
    { week: "W1", load: 245 },
    { week: "W2", load: 286 },
    { week: "W3", load: 312 },
    { week: "W4", load: 274 }
  ];

  return (
    <FlatList
      className="flex-1 bg-[#F1EFE8]"
      contentContainerStyle={{ padding: 16, gap: 16 }}
      ListHeaderComponent={
        <View style={{ gap: 16 }}>
          <OfflineBanner />
          <SharedComponents.Card variant="elevated">
            <View style={{ gap: 12 }}>
              <SectionHeader title={t("performance.title")} actionLabel={t("performance.logSession")} onAction={() => router.push("/(app)/performance/log-session")} />
              <SharedCharts.GaugeChart
                value={query.data.riskScore.score}
                thresholds={[
                  { value: 0.35, color: "#639922", label: "Low" },
                  { value: 0.65, color: "#BA7517", label: "Medium" },
                  { value: 0.85, color: "#D85A30", label: "High" },
                  { value: 1, color: "#E24B4A", label: "Critical" }
                ]}
              />
              <LastUpdatedLabel iso={query.data.riskScore.computed_at} />
            </View>
          </SharedComponents.Card>

          <SharedComponents.Card>
            <View style={{ gap: 12 }}>
              <SectionHeader title={t("performance.weeklyLoad")} />
              <SharedCharts.BarChart data={weekData} xKey="week" yKey="load" />
            </View>
          </SharedComponents.Card>

          <SharedComponents.Card>
            <View style={{ gap: 12 }}>
              <SectionHeader title={t("performance.indices")} />
              <View style={{ gap: 12 }}>
                {query.data.indices.map((item) => (
                  <SharedComponents.MetricTile key={item.id} label={item.index_name} value={item.value} trend="up" trendValue={`${Math.round(item.percentile_in_sport * 100)} percentile`} />
                ))}
              </View>
            </View>
          </SharedComponents.Card>

          <SharedComponents.Card>
            <View style={{ gap: 12 }}>
              <SectionHeader title={t("performance.filters")} />
              <FilterTabs options={sessionTypes} value={selectedType} onChange={setSelectedType} />
              <FilterTabs options={dateRanges} value={selectedRange} onChange={setSelectedRange} />
            </View>
          </SharedComponents.Card>

          <SectionHeader title={t("performance.history")} />
        </View>
      }
      data={filteredSessions}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/(app)/performance/${item.id}`)}>
          <SharedComponents.Card variant="outlined">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-semibold text-[#2C2C2A]">{item.session_type}</Text>
                <Text className="mt-1 text-xs text-[#5F5E5A]">{item.start_time}</Text>
              </View>
              <SharedComponents.Badge label={`RPE ${item.rpe ?? "-"}`} variant="info" />
            </View>
          </SharedComponents.Card>
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      onEndReached={() => {
        if (historyQuery.hasNextPage) {
          void historyQuery.fetchNextPage();
        }
      }}
    />
  );
}
