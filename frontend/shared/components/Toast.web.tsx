import React from "react";

import { radius, spacing } from "../tokens";
import { toastVariantStyles } from "./helpers";
import type { ToastProps } from "./types";

export function Toast({ title, message, variant = "info", visible = true, onClose }: ToastProps) {
  if (!visible) {
    return null;
  }
  const palette = toastVariantStyles[variant];
  return (
    <div
      role="status"
      style={{
        minWidth: 280,
        padding: spacing[4],
        borderRadius: radius.lg,
        background: palette.background,
        color: palette.color,
        border: `1px solid ${palette.color}`
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[3] }}>
        <div>
          <strong>{title}</strong>
          {message ? <p style={{ marginBottom: 0 }}>{message}</p> : null}
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} style={{ color: "inherit" }}>
            Close
          </button>
        ) : null}
      </div>
    </div>
  );
}
