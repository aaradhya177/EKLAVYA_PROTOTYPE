import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { changeLanguage, supportedLanguages, type SupportedLanguage } from "../lib/i18n";

export function LanguageSelector() {
  const { i18n, t } = useTranslation();

  return (
    <View className="rounded-2xl border border-[#D3D1C7] bg-white p-4">
      <Text className="mb-3 text-sm font-semibold text-[#444441]">{t("common.language")}</Text>
      <View className="flex-row flex-wrap gap-2">
        {supportedLanguages.map((language) => {
          const active = i18n.language === language;
          return (
            <Pressable
              key={language}
              onPress={() => {
                void changeLanguage(language as SupportedLanguage);
              }}
              className={`rounded-full px-3 py-2 ${active ? "bg-[#534AB7]" : "bg-[#F1EFE8]"}`}
            >
              <Text className={`text-xs font-semibold ${active ? "text-white" : "text-[#444441]"}`}>{language.toUpperCase()}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
