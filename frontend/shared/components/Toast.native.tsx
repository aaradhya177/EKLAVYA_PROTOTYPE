import React from "react";
import { Pressable, Text, View } from "react-native";

import { radius, spacing } from "../tokens";
import { toastVariantStyles } from "./helpers";
import type { ToastProps } from "./types";

export function Toast({ title, message, variant = "info", visible = true, onClose }: ToastProps) {
  if (!visible) {
    return null;
  }
  const palette = toastVariantStyles[variant];
  return (
    <View
      style={{
        minWidth: 280,
        padding: spacing[4],
        borderRadius: radius.lg,
        backgroundColor: palette.background,
        borderWidth: 1,
        borderColor: palette.color
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing[3] }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.color, fontWeight: "700" }}>{title}</Text>
          {message ? <Text style={{ color: palette.color, marginTop: 4 }}>{message}</Text> : null}
        </View>
        {onClose ? (
          <Pressable onPress={onClose}>
            <Text style={{ color: palette.color }}>Close</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
