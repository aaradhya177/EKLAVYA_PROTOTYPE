import React from "react";
import { Text, View } from "react-native";

import { colors, spacing } from "../tokens";
import { Button } from "./Button.native";
import type { EmptyStateProps } from "./types";

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={{ alignItems: "center", padding: spacing[6], gap: spacing[3] }}>
      <Text style={{ fontSize: 36 }}>{icon}</Text>
      <Text style={{ fontSize: 20, fontWeight: "700", color: colors.gray[800] }}>{title}</Text>
      <Text style={{ textAlign: "center", color: colors.gray[600] }}>{subtitle}</Text>
      {actionLabel ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}
