import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { OfflineBanner } from "../../../src/components/OfflineBanner";
import { Screen } from "../../../src/components/Screen";
import { SectionHeader } from "../../../src/components/SectionHeader";
import { TimelineItem } from "../../../src/components/TimelineItem";
import { useInjuryQuery } from "../../../src/hooks/useAthleteQueries";
import { SharedComponents } from "../../../src/shared";

export default function InjuryScreen() {
  const { t } = useTranslation();
  const query = useInjuryQuery();

  if (!query.data) {
    return <Screen><Text>{t("common.loading")}</Text></Screen>;
  }

  const recommendations = query.data.riskScore.score > 0.65 ? ["Consider a rest day", "Reduce speed volume tomorrow"] : ["Maintain current loading plan"];

  return (
    <Screen>
      <OfflineBanner />
      <SharedComponents.Card variant="elevated">
        <View style={{ gap: 16 }}>
          <SectionHeader title={t("injury.title")} actionLabel={t("injury.history")} onAction={() => router.push("/(app)/injury/history")} />
          <View className="items-center">
            <SharedComponents.RiskIndicator level={query.data.riskScore.risk_level} score={query.data.riskScore.score} />
          </View>
        </View>
      </SharedComponents.Card>

      <SharedComponents.Card>
        <View style={{ gap: 12 }}>
          <SectionHeader title="SHAP explanations" />
          {query.data.riskScore.contributing_factors.map((factor, index) => (
            <View key={index} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
              <Text className="text-sm font-semibold text-[#2C2C2A]">{String(factor.title ?? "Factor")}</Text>
              <Text className="mt-1 text-xs text-[#5F5E5A]">{String(factor.impact ?? "")}</Text>
            </View>
          ))}
        </View>
      </SharedComponents.Card>

      <SharedComponents.Card>
        <View style={{ gap: 12 }}>
          <SectionHeader title={t("injury.recommendations")} />
          {recommendations.map((item) => (
            <Text key={item} className="rounded-2xl bg-[#FAECE7] px-4 py-3 text-sm text-[#712B13]">
              {item}
            </Text>
          ))}
          <SharedComponents.Button label={t("injury.logNew")} onPress={() => router.push("/(app)/injury/history")} />
        </View>
      </SharedComponents.Card>

      <SharedComponents.Card variant="outlined">
        <View style={{ gap: 12 }}>
          {query.data.injuryHistory.map((injury) => (
            <TimelineItem key={injury.id} title={`${injury.body_part} · ${injury.injury_type}`} subtitle={injury.occurred_at} active />
          ))}
        </View>
      </SharedComponents.Card>
    </Screen>
  );
}
