import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Circle } from "react-native-svg";

import { Screen } from "../../../src/components/Screen";
import { useFinancialQuery } from "../../../src/hooks/useAthleteQueries";
import { SharedCharts, SharedComponents, formatCurrency } from "../../../src/shared";

export default function FinancialScreen() {
  const { t } = useTranslation();
  const query = useFinancialQuery();

  if (!query.data) {
    return <Screen><Text>{t("common.loading")}</Text></Screen>;
  }

  const totalIncome = query.data.income.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpense = query.data.cashflow.reduce((sum, item) => sum + Number(item.projected_expense), 0);
  const netSavings = totalIncome - totalExpense;
  const sponsorRatio = totalIncome === 0 ? 0 : Number(query.data.income[1]?.amount ?? 0) / totalIncome;
  const circumference = 2 * Math.PI * 34;
  const offset = circumference * (1 - sponsorRatio);

  return (
    <Screen>
      <SharedComponents.Card variant="elevated">
        <View style={{ gap: 12 }}>
          <Text className="text-2xl font-bold text-[#2C2C2A]">{t("financial.title")}</Text>
          <SharedComponents.MetricTile label="Income" value={formatCurrency(totalIncome)} />
          <SharedComponents.MetricTile label="Expense" value={formatCurrency(totalExpense)} />
          <SharedComponents.MetricTile label="Net savings" value={formatCurrency(netSavings)} color={netSavings >= 0 ? "#639922" : "#E24B4A"} />
        </View>
      </SharedComponents.Card>

      <SharedComponents.Card>
        <View style={{ gap: 12 }}>
          <Text className="text-xl font-semibold text-[#2C2C2A]">Income breakdown</Text>
          <View className="items-center">
            <Svg width={100} height={100} viewBox="0 0 100 100">
              <Circle cx={50} cy={50} r={34} stroke="#E1F5EE" strokeWidth={14} fill="none" />
              <Circle
                cx={50}
                cy={50}
                r={34}
                stroke="#1D9E75"
                strokeWidth={14}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                origin="50, 50"
                rotation={-90}
              />
            </Svg>
          </View>
          {query.data.income.map((item) => (
            <View key={item.id} className="flex-row items-center justify-between rounded-2xl bg-[#F1EFE8] px-4 py-3">
              <Text className="text-sm text-[#2C2C2A]">{item.source_type}</Text>
              <Text className="text-sm font-semibold text-[#2C2C2A]">{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>
      </SharedComponents.Card>

      <SharedComponents.Card variant="outlined">
        <View style={{ gap: 12 }}>
          <Text className="text-xl font-semibold text-[#2C2C2A]">{t("financial.grants")}</Text>
          {query.data.grants.map((grant) => (
            <View key={grant.id} className="rounded-2xl bg-white px-4 py-3">
              <Text className="text-sm font-semibold text-[#2C2C2A]">{grant.grant_scheme}</Text>
              <Text className="mt-1 text-xs text-[#5F5E5A]">{grant.conditions}</Text>
            </View>
          ))}
          <SharedComponents.Button label={t("financial.apply")} onPress={() => router.push("/(app)/financial/grants")} />
        </View>
      </SharedComponents.Card>

      <SharedComponents.Card>
        <View style={{ gap: 12 }}>
          <Text className="text-xl font-semibold text-[#2C2C2A]">{t("financial.cashflow")}</Text>
          <SharedCharts.LineChart data={query.data.cashflow.map((item) => ({ month: item.month.slice(5, 7), value: Number(item.projected_income) - Number(item.projected_expense) }))} xKey="month" yKey="value" />
          {query.data.cashflow.filter((item) => item.deficit_flag).map((item) => (
            <Text key={item.id} className="rounded-2xl bg-[#FCEBEB] px-4 py-3 text-sm text-[#A32D2D]">
              {item.month}: deficit projected
            </Text>
          ))}
        </View>
      </SharedComponents.Card>
    </Screen>
  );
}
