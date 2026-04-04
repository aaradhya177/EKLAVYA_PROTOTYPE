import { Link, router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { LastUpdatedLabel } from "../../src/components/LastUpdatedLabel";
import { OfflineBanner } from "../../src/components/OfflineBanner";
import { Screen } from "../../src/components/Screen";
import { SectionHeader } from "../../src/components/SectionHeader";
import { useDashboardQuery } from "../../src/hooks/useAthleteQueries";
import { useAthleteStore, useNotificationStore } from "../../src/stores";
import { SharedCharts, SharedComponents, formatDate, getRiskLabel, getSportIcon } from "../../src/shared";

export default function HomeScreen() {
  const { t } = useTranslation();
  const dashboardQuery = useDashboardQuery();
  const setProfile = useAthleteStore((state) => state.setProfile);
  const setSport = useAthleteStore((state) => state.setSport);
  const setNotifications = useNotificationStore((state) => state.setNotifications);

  const dashboard = dashboardQuery.data;

  React.useEffect(() => {
    if (!dashboard) {
      return;
    }
    setProfile(dashboard.athlete);
    setSport(dashboard.sport);
    setNotifications(dashboard.notifications);
  }, [dashboard, setNotifications, setProfile, setSport]);

  if (!dashboard) {
    return <Screen><Text>{t("common.loading")}</Text></Screen>;
  }

  const sparkData = dashboard.sessions.map((session) => Number(session.computed_metrics.load ?? session.rpe ?? 0));
  const upcomingGoal = dashboard.careerGoals[0];

  return (
    <Screen refreshing={dashboardQuery.isRefetching} onRefresh={() => void dashboardQuery.refetch()}>
      <OfflineBanner />
      <View className="rounded-[28px] bg-[#26215C] p-6">
        <Text className="text-3xl font-bold text-white">{t("dashboard.greeting", { name: dashboard.athlete.name.split(" ")[0] })}</Text>
        <Text className="mt-2 text-base text-[#CECBF6]">
          {getSportIcon(dashboard.sport.name)} {dashboard.sport.name}
        </Text>
      </View>

      <SharedComponents.Card variant="elevated">
        <View style={{ gap: 16 }}>
          <SectionHeader title={t("dashboard.todayReadiness")} />
          <View className="flex-row items-center justify-between">
            <SharedComponents.RiskIndicator level={dashboard.riskScore.risk_level} score={dashboard.riskScore.score} />
            <SharedCharts.GaugeChart
              value={Math.min(1, Number((dashboard.sessions[0]?.computed_metrics.load ?? 82) / 100))}
              thresholds={[
                { value: 0.35, color: "#639922", label: "Low" },
                { value: 0.65, color: "#BA7517", label: "Medium" },
                { value: 0.85, color: "#D85A30", label: "High" },
                { value: 1, color: "#E24B4A", label: "Critical" }
              ]}
            />
          </View>
          <Text className="text-sm text-[#5F5E5A]">{getRiskLabel(dashboard.riskScore.score)}</Text>
          <LastUpdatedLabel iso={dashboard.riskScore.computed_at} />
        </View>
      </SharedComponents.Card>

      <View style={{ gap: 12 }}>
        <SectionHeader title={t("dashboard.quickActions")} />
        <View className="flex-row flex-wrap gap-3">
          <SharedComponents.Button label={t("actions.logSession")} onPress={() => router.push("/(app)/performance/log-session")} />
          <SharedComponents.Button label={t("actions.viewPlan")} variant="secondary" onPress={() => router.push("/(app)/career")} />
          <SharedComponents.Button label={t("actions.checkRisk")} variant="ghost" onPress={() => router.push("/(app)/injury")} />
        </View>
      </View>

      <SharedComponents.Card>
        <View style={{ gap: 12 }}>
          <SectionHeader title={t("dashboard.recentNotifications")} actionLabel={t("dashboard.viewAll")} onAction={() => router.push("/(app)/notifications")} />
          {dashboard.notifications.slice(0, 3).map((item) => (
            <Link key={item.id} href="/(app)/notifications" asChild>
              <Text className="rounded-2xl bg-[#F1EFE8] px-4 py-3 text-sm text-[#2C2C2A]">
                {item.title}: {item.body}
              </Text>
            </Link>
          ))}
        </View>
      </SharedComponents.Card>

      <SharedComponents.Card>
        <View style={{ gap: 12 }}>
          <SectionHeader title={t("performance.title")} />
          <SharedCharts.SparkLine data={sparkData.length > 0 ? sparkData : [40, 52, 48, 60, 58, 65, 63]} />
        </View>
      </SharedComponents.Card>

      {upcomingGoal ? (
        <SharedComponents.Card variant="outlined">
          <View style={{ gap: 8 }}>
            <SectionHeader title={t("dashboard.upcomingCompetition")} />
            <Text className="text-lg font-semibold text-[#2C2C2A]">{upcomingGoal.priority_event ?? upcomingGoal.goal_type}</Text>
            <Text className="text-sm text-[#5F5E5A]">{formatDate(upcomingGoal.target_date)}</Text>
          </View>
        </SharedComponents.Card>
      ) : null}
    </Screen>
  );
}
