import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { useTranslation } from "react-i18next";

import { FormField } from "../../../src/components/FormField";
import { InAppToast } from "../../../src/components/InAppToast";
import { OfflineBanner } from "../../../src/components/OfflineBanner";
import { Screen } from "../../../src/components/Screen";
import { useNetworkStore } from "../../../src/lib/network";
import { queryKeys, queueSessionForOffline } from "../../../src/lib/offline";
import { apiClient } from "../../../src/lib/api";
import { useAthleteStore } from "../../../src/stores";
import { SharedComponents } from "../../../src/shared";

const sessionTypes = ["training", "competition", "recovery"] as const;
const rpeEmoji = ["😌", "🙂", "🙂", "🙂", "😐", "😓", "🥵", "🥵", "😵", "🔥"];

export default function LogSessionScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const profile = useAthleteStore((state) => state.profile);
  const sport = useAthleteStore((state) => state.sport);
  const [sessionType, setSessionType] = useState<(typeof sessionTypes)[number]>("training");
  const [startTime, setStartTime] = useState(new Date().toISOString());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000).toISOString());
  const [rpe, setRpe] = useState(6);
  const [notes, setNotes] = useState("");
  const [distance, setDistance] = useState("8.5");
  const [avgHr, setAvgHr] = useState("156");
  const [maxHr, setMaxHr] = useState("184");
  const [toast, setToast] = useState("");

  const payload = useMemo(
    () => ({
      id: Date.now(),
      athlete_id: profile?.id ?? "550e8400-e29b-41d4-a716-446655440000",
      sport_id: sport?.id ?? 1,
      session_type: sessionType,
      start_time: startTime,
      end_time: endTime,
      rpe,
      notes,
      raw_metrics: {
        distance: Number(distance),
        avg_hr: Number(avgHr),
        max_hr: Number(maxHr)
      },
      computed_metrics: {
        load: rpe * 10
      },
      coach_id: null
    }),
    [avgHr, distance, endTime, maxHr, notes, profile?.id, rpe, sessionType, sport?.id, startTime]
  );

  const submit = async () => {
    await queryClient.setQueryData(queryKeys.sessions, (previous: { sessions: typeof payload[]; indices: unknown[]; riskScore: unknown } | undefined) => {
      if (!previous) {
        return previous;
      }
      return { ...previous, sessions: [payload, ...previous.sessions] };
    });
    if (isOnline) {
      await apiClient.saveSession(payload);
      setToast(t("session.synced"));
    } else {
      await queueSessionForOffline(payload);
      setToast(t("session.queuedOffline"));
    }
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <Screen>
      <OfflineBanner />
      <SharedComponents.Card variant="elevated">
        <View style={{ gap: 12 }}>
          <Text className="text-2xl font-bold text-[#2C2C2A]">{t("performance.logSession")}</Text>
          <Text className="text-sm text-[#5F5E5A]">{sport?.name ?? "Athletics"}</Text>
        </View>
      </SharedComponents.Card>

      <SharedComponents.Card>
        <View style={{ gap: 12 }}>
          <Text className="text-sm font-semibold text-[#444441]">{t("session.sessionType")}</Text>
          <View className="flex-row flex-wrap gap-3">
            {sessionTypes.map((type) => (
              <SharedComponents.Button key={type} label={type} variant={type === sessionType ? "primary" : "secondary"} size="sm" onPress={() => setSessionType(type)} />
            ))}
          </View>
          <FormField label={t("session.startTime")} value={startTime} onChangeText={setStartTime} />
          <FormField label={t("session.endTime")} value={endTime} onChangeText={setEndTime} />
          <View style={{ gap: 8 }}>
            <Text className="text-sm font-semibold text-[#444441]">{t("session.rpe")}</Text>
            <Slider minimumValue={1} maximumValue={10} step={1} value={rpe} onValueChange={(value) => setRpe(value)} minimumTrackTintColor="#534AB7" />
            <Text className="text-base text-[#2C2C2A]">
              {rpe} {rpeEmoji[rpe - 1]}
            </Text>
          </View>
          <FormField label={t("session.notes")} value={notes} onChangeText={setNotes} multiline />
          <FormField label={t("session.distance")} value={distance} onChangeText={setDistance} />
          <FormField label={t("session.avgHr")} value={avgHr} onChangeText={setAvgHr} />
          <FormField label={t("session.maxHr")} value={maxHr} onChangeText={setMaxHr} />
          <SharedComponents.Button label={t("common.submit")} onPress={() => void submit()} />
          <SharedComponents.Button label={t("common.cancel")} variant="ghost" onPress={() => router.back()} />
        </View>
      </SharedComponents.Card>
      <InAppToast visible={Boolean(toast)} message={toast} />
    </Screen>
  );
}
