import React, { PropsWithChildren } from "react";
import { RefreshControl, ScrollView, View } from "react-native";

type ScreenProps = PropsWithChildren<{
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function Screen({ children, refreshing, onRefresh }: ScreenProps) {
  return (
    <ScrollView
      className="flex-1 bg-[#F1EFE8]"
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} /> : undefined}
    >
      <View style={{ gap: 16 }}>{children}</View>
    </ScrollView>
  );
}
