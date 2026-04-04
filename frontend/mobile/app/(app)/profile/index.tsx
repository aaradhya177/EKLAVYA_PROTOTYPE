import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../../src/components/Screen";
import { apiClient } from "../../../src/lib/api";
import { useAthleteStore } from "../../../src/stores";
import { SharedComponents } from "../../../src/shared";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const profile = useAthleteStore((state) => state.profile);
  const sport = useAthleteStore((state) => state.sport);
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8
    });
    if (!result.canceled) {
      const uri = result.assets[0]?.uri;
      if (uri) {
        const uploaded = await apiClient.uploadProfilePhoto(uri);
        setPhotoUri(uploaded.uri);
      }
    }
  };

  return (
    <Screen>
      <SharedComponents.Card variant="elevated">
        <View className="items-center" style={{ gap: 12 }}>
          <SharedComponents.Avatar name={profile?.name ?? "Athlete"} imageUrl={photoUri} size={88} tier={profile?.tier ?? undefined} />
          <Text className="text-2xl font-bold text-[#2C2C2A]">{profile?.name ?? "Aarohi Sharma"}</Text>
          <Text className="text-sm text-[#5F5E5A]">{sport?.name ?? "Athletics"}</Text>
          <SharedComponents.Button label={t("profile.photo")} variant="secondary" onPress={() => void pickPhoto()} />
        </View>
      </SharedComponents.Card>

      <SharedComponents.Card>
        <View style={{ gap: 12 }}>
          <Text className="text-sm text-[#5F5E5A]">{t("profile.assignedCoach")}</Text>
          <Text className="text-base font-semibold text-[#2C2C2A]">Coach Meera Singh</Text>
        </View>
      </SharedComponents.Card>

      <SharedComponents.Button label={t("profile.settings")} onPress={() => router.push("/(app)/profile/settings")} />
      <SharedComponents.Button label={t("profile.consent")} variant="secondary" onPress={() => router.push("/(app)/profile/consent")} />
    </Screen>
  );
}
