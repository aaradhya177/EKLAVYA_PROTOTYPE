import React from "react";
import { Text, View } from "react-native";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-xl font-semibold text-[#2C2C2A]">{title}</Text>
      {actionLabel ? (
        <Text className="text-sm font-semibold text-[#534AB7]" onPress={onAction}>
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}
