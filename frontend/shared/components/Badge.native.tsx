import React from "react";
import { Text, View } from "react-native";

import { radius } from "../tokens";
import { badgeVariantStyles } from "./helpers";
import type { BadgeProps } from "./types";

export function Badge({ label, variant = "neutral", size = "md" }: BadgeProps) {
  const palette = badgeVariantStyles[variant];
  const paddingVertical = size === "sm" ? 2 : size === "md" ? 4 : 6;
  const paddingHorizontal = size === "sm" ? 8 : size === "md" ? 10 : 12;
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingVertical,
        paddingHorizontal,
        borderRadius: radius.full,
        backgroundColor: palette.background
      }}
    >
      <Text style={{ color: palette.color, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}
