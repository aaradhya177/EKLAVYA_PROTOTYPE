import React from "react";

import { colors } from "../tokens";
import type { LoadingSpinnerProps } from "./types";

export function LoadingSpinner({ size = "md", overlay = false }: LoadingSpinnerProps) {
  const dimension = size === "sm" ? 18 : size === "md" ? 24 : 32;
  const spinner = (
    <div
      aria-label="Loading"
      style={{
        width: dimension,
        height: dimension,
        borderRadius: "50%",
        border: `3px solid ${colors.gray[100]}`,
        borderTop: `3px solid ${colors.primary[600]}`,
        animation: "spin 0.8s linear infinite"
      }}
    />
  );

  if (!overlay) {
    return spinner;
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.65)"
      }}
    >
      {spinner}
    </div>
  );
}
