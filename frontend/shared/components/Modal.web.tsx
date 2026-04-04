import React, { useEffect } from "react";
import { createPortal } from "react-dom";

import { colors, radius, spacing } from "../tokens";
import type { ModalProps } from "./types";

export function Modal({ open, title, children, onClose }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17, 24, 39, 0.45)",
        display: "grid",
        placeItems: "center",
        padding: spacing[5]
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          background: colors.white,
          borderRadius: radius.xl,
          padding: spacing[5]
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[3], marginBottom: spacing[4] }}>
          {title ? <h3 style={{ margin: 0 }}>{title}</h3> : <span />}
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
