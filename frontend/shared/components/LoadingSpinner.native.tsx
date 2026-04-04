import React from "react";
import { ActivityIndicator, View } from "react-native";

import { colors } from "../tokens";
import type { LoadingSpinnerProps } from "./types";

export function LoadingSpinner({ size = "md", overlay = false }: LoadingSpinnerProps) {
  const indicator = <ActivityIndicator color={colors.primary[600]} size={size === "lg" ? "large" : "small"} />;

  if (!overlay) {
    return indicator;
  }

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.65)"
      }}
    >
      {indicator}
    </View>
  );
}
