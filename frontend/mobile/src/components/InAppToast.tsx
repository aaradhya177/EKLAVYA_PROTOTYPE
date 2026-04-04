import React from "react";
import { Text, View } from "react-native";

type InAppToastProps = {
  visible: boolean;
  message: string;
};

export function InAppToast({ visible, message }: InAppToastProps) {
  if (!visible) {
    return null;
  }

  return (
    <View className="absolute bottom-6 left-4 right-4 rounded-2xl bg-[#26215C] px-4 py-3">
      <Text className="text-sm font-semibold text-white">{message}</Text>
    </View>
  );
}
