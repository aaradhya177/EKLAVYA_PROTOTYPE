import React from "react";
import { Text, View } from "react-native";

type TimelineItemProps = {
  title: string;
  subtitle: string;
  active?: boolean;
};

export function TimelineItem({ title, subtitle, active = false }: TimelineItemProps) {
  return (
    <View className="flex-row gap-3">
      <View className="items-center">
        <View className={`h-3 w-3 rounded-full ${active ? "bg-[#639922]" : "bg-[#B4B2A9]"}`} />
        <View className="h-12 w-[2px] bg-[#D3D1C7]" />
      </View>
      <View className="flex-1 rounded-2xl bg-white p-3">
        <Text className="text-sm font-semibold text-[#2C2C2A]">{title}</Text>
        <Text className="mt-1 text-xs text-[#5F5E5A]">{subtitle}</Text>
      </View>
    </View>
  );
}
