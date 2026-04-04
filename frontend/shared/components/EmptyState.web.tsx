import React from "react";

import { colors, spacing } from "../tokens";
import { Button } from "./Button.web";
import type { EmptyStateProps } from "./types";

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: spacing[3],
        padding: spacing[6],
        color: colors.gray[800]
      }}
    >
      <div style={{ fontSize: 36 }}>{icon}</div>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p style={{ margin: 0, maxWidth: 320, color: colors.gray[600] }}>{subtitle}</p>
      {actionLabel ? <Button label={actionLabel} onPress={onAction} /> : null}
    </div>
  );
}
