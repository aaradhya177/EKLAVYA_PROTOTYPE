import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../../src/components/Screen";
import { TimelineItem } from "../../../src/components/TimelineItem";
import { useCareerQuery } from "../../../src/hooks/useAthleteQueries";
import { SharedComponents } from "../../../src/shared";

export default function CareerScreen() {
  const { t } = useTranslation();
  const query = useCareerQuery();

  if (!query.data) {
    return <Screen><Text>{t("common.loading")}</Text></Screen>;
  }

  const goal = query.data.goals[0];
  const daysToTarget = goal ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <Screen>
      {goal ? (
        <SharedComponents.Card variant="elevated">
          <View style={{ gap: 8 }}>
            <Text className="text-sm text-[#5F5E5A]">{t("career.activeGoal")}</Text>
            <Text className="text-xl font-bold text-[#2C2C2A]">{goal.priority_event ?? goal.goal_type}</Text>
            <Text className="text-sm text-[#534AB7]">{daysToTarget} days to target</Text>
          </View>
        </SharedComponents.Card>
      ) : null}

      <SharedComponents.Card>
        <View style={{ gap: 12 }}>
          <Text className="text-xl font-semibold text-[#2C2C2A]">{t("career.plan")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {query.data.plan.periodization_blocks.map((block, index) => (
                <View key={block.block_name} className={`w-60 rounded-[24px] p-4 ${index === 1 ? "bg-[#534AB7]" : "bg-white"}`}>
                  <Text className={`text-base font-semibold ${index === 1 ? "text-white" : "text-[#2C2C2A]"}`}>{block.block_name}</Text>
                  <Text className={`mt-2 text-xs ${index === 1 ? "text-[#CECBF6]" : "text-[#5F5E5A]"}`}>{block.focus_areas.join(" • ")}</Text>
                  <Text className={`mt-3 text-xs ${index === 1 ? "text-[#CECBF6]" : "text-[#5F5E5A]"}`}>{block.start_date} → {block.end_date}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </SharedComponents.Card>

      <SharedComponents.Card variant="outlined">
        <View style={{ gap: 12 }}>
          <Text className="text-xl font-semibold text-[#2C2C2A]">{t("career.milestones")}</Text>
          <TimelineItem title="National camp selection" subtitle="Achieved • Jan 2025" active />
          <TimelineItem title="Qualify for finals" subtitle="Upcoming • May 2025" />
        </View>
      </SharedComponents.Card>

      {query.data.talentSignal ? (
        <SharedComponents.Card>
          <View style={{ gap: 10 }}>
            <Text className="text-xl font-semibold text-[#2C2C2A]">{t("career.talentSignal")}</Text>
            <SharedComponents.Badge label="Breakthrough detected this week 🚀" variant="success" />
          </View>
        </SharedComponents.Card>
      ) : null}

      <SharedComponents.Button label={t("career.milestones")} variant="secondary" onPress={() => router.push("/(app)/career/milestones")} />
    </Screen>
  );
}
