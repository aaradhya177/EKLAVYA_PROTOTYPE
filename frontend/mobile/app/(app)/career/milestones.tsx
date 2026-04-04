import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../../src/components/Screen";
import { TimelineItem } from "../../../src/components/TimelineItem";
import { SharedComponents } from "../../../src/shared";

export default function MilestonesScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <SharedComponents.Card variant="elevated">
        <Text className="text-2xl font-bold text-[#2C2C2A]">{t("career.milestones")}</Text>
      </SharedComponents.Card>
      <View style={{ gap: 12 }}>
        <TimelineItem title="National camp selection" subtitle="Achieved in green" active />
        <TimelineItem title="Top-3 season ranking" subtitle="Upcoming in gray" />
        <TimelineItem title="Peak event execution" subtitle="Upcoming in gray" />
      </View>
    </Screen>
  );
}
