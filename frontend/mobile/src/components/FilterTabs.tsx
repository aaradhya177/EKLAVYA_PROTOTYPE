import React from "react";
import { Pressable, Text, View } from "react-native";

type FilterTabsProps<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
};

export function FilterTabs<T extends string>({ options, value, onChange }: FilterTabsProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            className={`rounded-full px-4 py-2 ${active ? "bg-[#534AB7]" : "bg-white"}`}
          >
            <Text className={`text-sm font-semibold ${active ? "text-white" : "text-[#444441]"}`}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
