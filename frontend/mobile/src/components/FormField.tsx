import React from "react";
import { Text, TextInput, View } from "react-native";

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  multiline?: boolean;
};

export function FormField({ label, value, onChangeText, placeholder, secureTextEntry, error, multiline }: FormFieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text className="text-sm font-medium text-[#444441]">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        className="rounded-2xl border border-[#D3D1C7] bg-white px-4 py-3 text-base text-[#2C2C2A]"
      />
      {error ? <Text className="text-xs text-[#A32D2D]">{error}</Text> : null}
    </View>
  );
}
