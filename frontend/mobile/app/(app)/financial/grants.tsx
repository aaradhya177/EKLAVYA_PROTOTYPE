import React from "react";
import { Linking, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../../src/components/Screen";
import { useFinancialQuery } from "../../../src/hooks/useAthleteQueries";
import { SharedComponents } from "../../../src/shared";

export default function GrantsScreen() {
  const { t } = useTranslation();
  const query = useFinancialQuery();

  return (
    <Screen>
      <SharedComponents.Card variant="elevated">
        <Text className="text-2xl font-bold text-[#2C2C2A]">{t("financial.grants")}</Text>
      </SharedComponents.Card>
      <View style={{ gap: 12 }}>
        {query.data?.grants.map((grant) => (
          <SharedComponents.Card key={grant.id}>
            <View style={{ gap: 10 }}>
              <Text className="text-lg font-semibold text-[#2C2C2A]">{grant.grant_scheme}</Text>
              <Text className="text-sm text-[#5F5E5A]">{grant.conditions}</Text>
              <SharedComponents.Button label={t("financial.apply")} onPress={() => void Linking.openURL("https://example.org/grants/apply")} />
            </View>
          </SharedComponents.Card>
        ))}
      </View>
    </Screen>
  );
}
